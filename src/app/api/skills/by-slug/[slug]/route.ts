import { NextResponse } from "next/server";
import { SkillRepository } from "@/lib/skills/repository";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
): Promise<NextResponse> {
  try {
    const { slug } = await params;
    const repository = new SkillRepository(process.env.DATA_DIR ?? "data");
    
    const skill = await repository.getBySlug(slug);
    if (!skill) {
      return NextResponse.json(
        { success: false, error: "技能不存在" },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ success: true, skill });
  } catch (error) {
    console.error("Failed to get skill by slug:", error);
    return NextResponse.json(
      { success: false, error: "获取技能失败" },
      { status: 500 }
    );
  }
}
