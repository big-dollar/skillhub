import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/session";
import { processUpload } from "@/lib/ingestion/upload-service";
import type { IngestionError } from "@/lib/ingestion/types";
import { SkillRepository } from "@/lib/skills/repository";
import { SkillService } from "@/lib/skills/service";
import { UserRepository } from "@/lib/users/repository";
import type { Visibility } from "@/lib/skills/types";

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const session = await requireSession(request);
    const formData = await request.formData();
    const title = formData.get("title");
    const summary = formData.get("summary");
    const file = formData.get("file");
    const visibility = (formData.get("visibility") as Visibility) || "public";
    const tags = formData.getAll("tags") as string[];

    if (typeof title !== "string" || typeof summary !== "string" || !(file instanceof File)) {
        return NextResponse.json({ success: false, error: "缺少必填字段" }, { status: 400 });
    }

    const dataDir = process.env.DATA_DIR ?? "data";
    
    // Save/update user info
    const userRepo = new UserRepository(dataDir);
    await userRepo.saveOrUpdateUser(session.user, session.provider);
    
    const repository = new SkillRepository(dataDir);
    const service = new SkillService(repository);
    const result = await processUpload(
      {
        title: title.trim(),
        summary: summary.trim(),
        file,
      },
      session.user,
      dataDir,
      service,
      tags,
      visibility,
    );

    if (!result.success) {
      const error = result as IngestionError;
      return NextResponse.json({ success: false, error: error.error, code: error.code }, { status: 400 });
    }

    // Get the skill directly from repository with userId to bypass visibility check for the uploader
    const userIdForQuery = typeof session.user.id === "number" ? session.user.id : session.user.name;
    const skill = await repository.getById(result.skillId, userIdForQuery);

    return NextResponse.json({ success: true, skill });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
        return NextResponse.json({ success: false, error: "请先登录后再上传 skill" }, { status: 401 });
      }

      return NextResponse.json({ success: false, error: "服务器内部错误" }, { status: 500 });
  }
}
