import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/session";
import { requireAdmin } from "@/lib/admin/auth";
import { SkillRepository } from "@/lib/skills/repository";
import { UserRepository } from "@/lib/users/repository";

// GET /api/admin/stats - 获取系统统计数据（管理员）
export async function GET(request: Request): Promise<NextResponse> {
  try {
    const session = await requireSession(request);
    requireAdmin(session.user);

    const dataDir = process.env.DATA_DIR ?? "data";
    const skillRepo = new SkillRepository(dataDir);
    const userRepo = new UserRepository(dataDir);

    const skills = await skillRepo.list();
    const users = await userRepo.list();

    // 计算统计数据
    const totalSkills = skills.length;
    const publicSkills = skills.filter((s) => s.visibility === "public" || !s.visibility).length;
    const privateSkills = skills.filter((s) => s.visibility === "private").length;
    const totalUsers = users.length;
    const totalLikes = skills.reduce((sum, s) => sum + s.likes, 0);
    const totalDownloads = skills.reduce((sum, s) => sum + s.downloads, 0);

    // 获取最近上传的技能
    const recentSkills = [...skills]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);

    // 获取最活跃的用户（按上传数量）
    const userUploadCounts = skills.reduce((acc, skill) => {
      const userId = skill.uploaderGitHubId ?? skill.uploaderName ?? "unknown";
      acc[userId] = (acc[userId] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topUploaders = Object.entries(userUploadCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([userId, count]) => {
        const user = users.find((u) => u.id === userId || u.name === userId);
        return {
          userId,
          name: user?.name ?? userId,
          avatar: user?.avatar_url ?? "",
          count,
        };
      });

    return NextResponse.json({
      success: true,
      stats: {
        totalSkills,
        publicSkills,
        privateSkills,
        totalUsers,
        totalLikes,
        totalDownloads,
        recentSkills,
        topUploaders,
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json(
        { success: false, error: "请先登录" },
        { status: 401 }
      );
    }

    if (error instanceof Error && error.message.includes("Forbidden")) {
      return NextResponse.json(
        { success: false, error: "需要管理员权限" },
        { status: 403 }
      );
    }

    console.error("Failed to get stats:", error);
    return NextResponse.json(
      { success: false, error: "获取统计数据失败" },
      { status: 500 }
    );
  }
}
