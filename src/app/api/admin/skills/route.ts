import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/session";
import { requireAdmin } from "@/lib/admin/auth";
import { SkillRepository } from "@/lib/skills/repository";

// GET /api/admin/skills - 获取所有技能（管理员）
export async function GET(request: Request): Promise<NextResponse> {
  try {
    const session = await requireSession(request);
    requireAdmin(session.user);

    const repository = new SkillRepository(process.env.DATA_DIR ?? "data");
    const skills = await repository.list();

    return NextResponse.json({ success: true, skills });
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

    console.error("Failed to get all skills:", error);
    return NextResponse.json(
      { success: false, error: "获取技能列表失败" },
      { status: 500 }
    );
  }
}
