import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/session";
import { processUpload } from "@/lib/ingestion/upload-service";
import type { IngestionError } from "@/lib/ingestion/types";
import { SkillRepository } from "@/lib/skills/repository";
import { SkillService } from "@/lib/skills/service";
import { UserRepository } from "@/lib/users/repository";
import type { Visibility } from "@/lib/skills/types";


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
    const dataDir = process.env.DATA_DIR ?? "data";
    const repository = new SkillRepository(dataDir);
    
    // Get user ID for permission checks
    const userId = typeof session.user.id === "number" ? session.user.id : session.user.name;
    
    // Get the existing skill with userId to allow owner access to private skills
    const existingSkill = await repository.getById(id, userId);
    if (!existingSkill) {
      return NextResponse.json(
        { success: false, error: "技能不存在" },
        { status: 404 }
      );
    }
    
    // Check if user owns this skill
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
    const visibility = (formData.get("visibility") as Visibility) || existingSkill.visibility || "public";
    const tags = formData.getAll("tags") as string[];

    if (typeof title !== "string" || typeof summary !== "string") {
      return NextResponse.json(
        { success: false, error: "缺少必填字段" },
        { status: 400 }
      );
    }

    // Save/update user info
    const userRepo = new UserRepository(dataDir);
    await userRepo.saveOrUpdateUser(session.user, session.provider);
    
    const service = new SkillService(repository);
    
    // If a new file is uploaded, process it
    let updateData: Partial<typeof existingSkill> = {
      title: title.trim(),
      summary: summary.trim(),
      visibility,
      tags: tags.length > 0 ? tags : existingSkill.tags,
    };
    
    if (file instanceof File && file.size > 0) {
      const result = await processUpload(
        {
          title: title.trim(),
          summary: summary.trim(),
          file,
        },
        session.user,
        dataDir,
        service,
        tags.length > 0 ? tags : existingSkill.tags,
        visibility,
      );

      if (!result.success) {
        const error = result as IngestionError;
        return NextResponse.json(
          { success: false, error: error.error, code: error.code },
          { status: 400 }
        );
      }

      updateData = {
        ...updateData,
        archivePath: result.archivePath,
        skillMdPath: result.skillMdPath,
        readmeStubPath: result.readmeStubPath,
      };
    }

    // Calculate new version
    const newVersion = incrementVersion(existingSkill.version);
    updateData.version = newVersion;

    // Update the existing skill
    const updatedSkill = await repository.update(id, updateData);

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
