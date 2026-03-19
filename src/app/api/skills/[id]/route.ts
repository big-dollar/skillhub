import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/session";
import { SkillRepository } from "@/lib/skills/repository";

// GET /api/skills/[id] - Get skill by ID
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await params;
    const repository = new SkillRepository(process.env.DATA_DIR ?? "data");
    
    const skill = await repository.getById(id);
    if (!skill) {
      return NextResponse.json(
        { success: false, error: "技能不存在" },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ success: true, skill });
  } catch (error) {
    console.error("Failed to get skill:", error);
    return NextResponse.json(
      { success: false, error: "获取技能失败" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const session = await requireSession(request);
    const { id } = await params;
    const repository = new SkillRepository(process.env.DATA_DIR ?? "data");
    
    // Get the skill
    const skill = await repository.getById(id);
    if (!skill) {
      return NextResponse.json(
        { success: false, error: "技能不存在" },
        { status: 404 }
      );
    }
    
    // Check if user owns this skill
    const userId = typeof session.user.id === "number" ? session.user.id : session.user.name;
    const uploaderId = skill.uploaderGitHubId ?? skill.uploaderName;
    if (uploaderId !== userId) {
      return NextResponse.json(
        { success: false, error: "无权删除此技能" },
        { status: 403 }
      );
    }
    
    await repository.delete(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json(
        { success: false, error: "请先登录" },
        { status: 401 }
      );
    }
    
    console.error("Failed to delete skill:", error);
    return NextResponse.json(
      { success: false, error: "删除技能失败" },
      { status: 500 }
    );
  }
}
