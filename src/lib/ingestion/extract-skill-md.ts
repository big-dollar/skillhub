import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import AdmZip from "adm-zip";
import type { ExtractedSkillMd, IngestionError } from "@/lib/ingestion/types";

export const MAX_ARCHIVE_BYTES = 10 * 1024 * 1024;
const SKILL_MD_FILENAME = "skill.md";

export async function extractSkillMd(
  fileBuffer: Buffer,
  fileName: string,
  extractDir: string,
): Promise<ExtractedSkillMd | IngestionError> {
  if (!fileName.toLowerCase().endsWith(".zip")) {
    return {
      success: false,
      error: "Only .zip files are allowed",
      code: "INVALID_FILE",
    };
  }

  if (fileBuffer.length > MAX_ARCHIVE_BYTES) {
    return {
      success: false,
      error: `File size exceeds ${MAX_ARCHIVE_BYTES / 1024 / 1024}MB limit`,
      code: "INVALID_SIZE",
    };
  }

  try {
    const zip = new AdmZip(fileBuffer);
    const skillMdEntry = zip.getEntries().find((entry) => {
      if (entry.isDirectory) {
        return false;
      }

      const entryName = entry.entryName.replace(/\\/g, "/");
      const baseName = entryName.split("/").pop()?.toLowerCase();
      return baseName === SKILL_MD_FILENAME;
    });

    if (!skillMdEntry) {
      return {
        success: false,
        error: "Archive must contain a SKILL.md file",
        code: "MISSING_SKILL_MD",
      };
    }

    const skillMdContent = skillMdEntry.getData().toString("utf8");
    await mkdir(extractDir, { recursive: true });

    const skillMdPath = path.join(extractDir, `${randomUUID()}-skill.md`);
    await writeFile(skillMdPath, skillMdContent, "utf8");

    return { skillMdContent, skillMdPath };
  } catch (error) {
    return {
      success: false,
      error: `Failed to extract archive: ${error instanceof Error ? error.message : "Unknown error"}`,
      code: "EXTRACTION_FAILED",
    };
  }
}
