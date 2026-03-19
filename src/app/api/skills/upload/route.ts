import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/session";
import { processUpload } from "@/lib/ingestion/upload-service";
import type { IngestionError } from "@/lib/ingestion/types";
import { SkillRepository } from "@/lib/skills/repository";
import { SkillService } from "@/lib/skills/service";

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const session = await requireSession(request);
    const formData = await request.formData();
    const title = formData.get("title");
    const summary = formData.get("summary");
    const file = formData.get("file");

    if (typeof title !== "string" || typeof summary !== "string" || !(file instanceof File)) {
        return NextResponse.json({ success: false, error: "缺少必填字段" }, { status: 400 });
    }

    const service = new SkillService(new SkillRepository(process.env.DATA_DIR ?? "data"));
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
      return NextResponse.json({ success: false, error: error.error, code: error.code }, { status: 400 });
    }

    const skill = await service.getSkillById(result.skillId);

    return NextResponse.json({ success: true, skill });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
        return NextResponse.json({ success: false, error: "请先登录后再上传 skill" }, { status: 401 });
      }

      return NextResponse.json({ success: false, error: "服务器内部错误" }, { status: 500 });
  }
}
