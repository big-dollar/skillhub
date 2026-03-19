export interface UploadInput {
  title: string;
  summary: string;
  file: File;
}

export interface ExtractedSkillMd {
  skillMdContent: string;
  skillMdPath: string;
}

export interface IngestionResult {
  success: true;
  skillId: string;
  archivePath: string;
  skillMdPath: string;
  readmeStubPath: string;
}

export interface IngestionError {
  success: false;
  error: string;
  code: "INVALID_FILE" | "MISSING_SKILL_MD" | "EXTRACTION_FAILED" | "INVALID_SIZE";
}
