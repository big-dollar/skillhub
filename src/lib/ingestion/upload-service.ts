import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { extractSkillMd } from "@/lib/ingestion/extract-skill-md";
import { generateReadmeStub } from "@/lib/ingestion/generate-readme-stub";
import type { IngestionError, IngestionResult, UploadInput } from "@/lib/ingestion/types";
import { SkillService } from "@/lib/skills/service";
import type { GitHubUser } from "@/lib/auth/types";

export async function processUpload(
  input: UploadInput,
  uploader: GitHubUser,
  dataDir: string,
  skillService: SkillService,
): Promise<IngestionResult | IngestionError> {
  const resolvedDataDir = path.isAbsolute(dataDir) ? dataDir : path.join(process.cwd(), dataDir);
  const uploadsDir = path.join(resolvedDataDir, "uploads");
  const extractedDir = path.join(resolvedDataDir, "extracted");
  const generatedDir = path.join(resolvedDataDir, "generated");
  const fileBuffer = Buffer.from(await input.file.arrayBuffer());
  const extractionResult = await extractSkillMd(fileBuffer, input.file.name, extractedDir);

  if (!("skillMdContent" in extractionResult)) {
    return extractionResult;
  }

  const archiveName = `${randomUUID()}-${sanitizeFileName(input.file.name)}`;
  const archivePath = path.join(uploadsDir, archiveName);
  await mkdir(uploadsDir, { recursive: true });
  await writeFile(archivePath, fileBuffer);

  const readmeStubPath = await generateReadmeStub(extractionResult.skillMdContent, input.title, generatedDir);
  const skill = await skillService.createSkill({
    title: input.title,
    summary: input.summary,
    uploaderName: uploader.name ?? uploader.login,
    uploaderAvatar: uploader.avatar_url,
    uploaderGitHubId: uploader.id,
    archivePath: path.relative(process.cwd(), archivePath),
    skillMdPath: path.relative(process.cwd(), extractionResult.skillMdPath),
    readmeStubPath: path.relative(process.cwd(), readmeStubPath),
  });

  return {
    success: true,
    skillId: skill.id,
    archivePath,
    skillMdPath: extractionResult.skillMdPath,
    readmeStubPath,
  };
}

function sanitizeFileName(fileName: string): string {
  return fileName.replace(/[^a-zA-Z0-9._-]+/g, "-");
}
