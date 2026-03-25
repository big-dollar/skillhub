import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/session";
import { SkillRepository } from "@/lib/skills/repository";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const session = await requireSession(request);
    const { id } = await params;
    const repository = new SkillRepository(process.env.DATA_DIR ?? "data");
    
    // Get the existing skill
    const existingSkill = await repository.getById(id);
    if (!existingSkill) {
      return NextResponse.json(
        { success: false, error: "技能不存在" },
        { status: 404 }
      );
    }
    
    // Check if user owns this skill
    const userId = typeof session.user.id === "number" ? session.user.id : session.user.name;
    const uploaderId = existingSkill.uploaderGitHubId ?? existingSkill.uploaderName;
    if (uploaderId !== userId) {
      return NextResponse.json(
        { success: false, error: "无权分享此技能" },
        { status: 403 }
      );
    }
    
    const body = await request.json();
    const { userId: targetUserId, userName, userAvatar } = body;

    if (!targetUserId || !userName) {
      return NextResponse.json(
        { success: false, error: "缺少必要参数" },
        { status: 400 }
      );
    }

    // Share the skill
    const updatedSkill = await repository.shareSkill(
      id,
      targetUserId,
      userName,
      userAvatar || ""
    );

    return NextResponse.json({ success: true, skill: updatedSkill });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json(
        { success: false, error: "请先登录" },
        { status: 401 }
      );
    }

    console.error("Failed to share skill:", error);
    return NextResponse.json(
      { success: false, error: "分享技能失败" },
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
    
    // Get the existing skill
    const existingSkill = await repository.getById(id);
    if (!existingSkill) {
      return NextResponse.json(
        { success: false, error: "技能不存在" },
        { status: 404 }
      );
    }
    
    // Check if user owns this skill
    const userId = typeof session.user.id === "number" ? session.user.id : session.user.name;
    const uploaderId = existingSkill.uploaderGitHubId ?? existingSkill.uploaderName;
    if (uploaderId !== userId) {
      return NextResponse.json(
        { success: false, error: "无权取消分享此技能" },
        { status: 403 }
      );
    }
    
    const body = await request.json();
    const { userId: targetUserId } = body;

    if (!targetUserId) {
      return NextResponse.json(
        { success: false, error: "缺少必要参数" },
        { status: 400 }
      );
    }

    // Remove share
    const updatedSkill = await repository.removeShare(id, targetUserId);

    return NextResponse.json({ success: true, skill: updatedSkill });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json(
        { success: false, error: "请先登录" },
        { status: 401 }
      );
    }

    console.error("Failed to remove share:", error);
    return NextResponse.json(
      { success: false, error: "取消分享失败" },
      { status: 500 }
    );
  }
}
