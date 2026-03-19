import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/session";
import { SkillRepository } from "@/lib/skills/repository";

export async function GET(request: Request): Promise<NextResponse> {
  try {
    const session = await requireSession(request);
    const repository = new SkillRepository(process.env.DATA_DIR ?? "data");
    
    // Get user ID from session
    const userId = typeof session.user.id === "number" ? session.user.id : (session.user.name ?? "");
    const skills = await repository.getByUploader(userId);
    
    return NextResponse.json({ success: true, skills });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json(
        { success: false, error: "请先登录" },
        { status: 401 }
      );
    }
    
    console.error("Failed to fetch user skills:", error);
    return NextResponse.json(
      { success: false, error: "获取技能列表失败" },
      { status: 500 }
    );
  }
}
