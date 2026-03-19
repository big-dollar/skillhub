import { NextResponse } from "next/server";
import { SkillRepository } from "@/lib/skills/repository";
import { SkillService } from "@/lib/skills/service";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(_request: Request, context: RouteContext): Promise<NextResponse> {
  const { id } = await context.params;

  try {
    const service = new SkillService(new SkillRepository(process.env.DATA_DIR ?? "data"));
    const skill = await service.likeSkill(id);

    return NextResponse.json({
      success: true,
      skill,
      likes: skill.likes,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Skill not found") {
      return NextResponse.json({ success: false, error: "Skill not found" }, { status: 404 });
    }

    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
