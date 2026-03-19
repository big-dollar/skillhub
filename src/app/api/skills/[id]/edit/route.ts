import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/session";
import { processUpload } from "@/lib/ingestion/upload-service";
import type { IngestionError } from "@/lib/ingestion/types";
import { SkillRepository } from "@/lib/skills/repository";
import { SkillService } from "@/lib/skills/service";

// 版本号递增函数
function incrementVersion(currentVersion: string | undefined): string {
  if (!currentVersion) {
    return "V1.0.0";
  }
  
  // 解析版本号 V1.0.0
  const match = currentVersion.match(/V(\d+)\.(\d+)\.(\d+)/);
  if (!match) {
    return "V1.0.0";
  }
  
  const [, major, minor, patch] = match;
  // 主版本号 +1
  return `V${parseInt(major) + 1}.0.0`;
}

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
        { success: false, error: "无权编辑此技能" },
        { status: 403 }
      );
    }
    
    const formData = await request.formData();
    const title = formData.get("title");
    const summary = formData.get("summary");
    const file = formData.get("file");

    if (typeof title !== "string" || typeof summary !== "string" || !(file instanceof File)) {
      return NextResponse.json(
        { success: false, error: "缺少必填字段" },
        { status: 400 }
      );
    }

    const service = new SkillService(repository);
    
    // Process the new upload
    const result = await processUpload(
      {
        title: title.trim(),
        summary: summary.trim(),
        file,
      },
      session.user,
      process.env.DATA_DIR ?? "data",
      service,
    );

    if (!result.success) {
      const error = result as IngestionError;
      return NextResponse.json(
        { success: false, error: error.error, code: error.code },
        { status: 400 }
      );
    }

    // Calculate new version
    const newVersion = incrementVersion(existingSkill.version);

    // Update the existing skill with new data and version
    const updatedSkill = await repository.update(id, {
      title: title.trim(),
      summary: summary.trim(),
      archivePath: result.archivePath,
      skillMdPath: result.skillMdPath,
      readmeStubPath: result.readmeStubPath,
      version: newVersion,
    });

    return NextResponse.json({ success: true, skill: updatedSkill });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json(
        { success: false, error: "请先登录后再编辑" },
        { status: 401 }
      );
    }

    console.error("Failed to edit skill:", error);
    return NextResponse.json(
      { success: false, error: "编辑技能失败" },
      { status: 500 }
    );
  }
}
