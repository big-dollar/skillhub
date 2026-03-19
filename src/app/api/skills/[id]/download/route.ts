import { access, readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { SkillRepository } from "@/lib/skills/repository";
import { SkillService } from "@/lib/skills/service";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, context: RouteContext): Promise<NextResponse> {
  const { id } = await context.params;
  const service = new SkillService(new SkillRepository(process.env.DATA_DIR ?? "data"));
  const skill = await service.getSkillById(id);

  if (!skill) {
    return NextResponse.json({ success: false, error: "Skill not found" }, { status: 404 });
  }

  const archivePath = path.resolve(process.cwd(), skill.archivePath);

  try {
    await access(archivePath);
  } catch {
    return NextResponse.json({ success: false, error: "File not found" }, { status: 404 });
  }

  await service.recordDownload(id);
  const fileBuffer = await readFile(archivePath);

  return new NextResponse(fileBuffer, {
    status: 200,
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${path.basename(archivePath)}"`,
      "Content-Length": fileBuffer.byteLength.toString(),
    },
  });
}
