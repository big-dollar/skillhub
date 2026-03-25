import type { SkillRecord } from "@/lib/skills/types";

interface SkillRecordOverrides extends Partial<SkillRecord> {
  id: string;
  slug?: string;
  title?: string;
}

export function createSkillRecord(overrides: SkillRecordOverrides): SkillRecord {
  return {
    id: overrides.id,
    slug: overrides.slug ?? overrides.id,
    title: overrides.title ?? `Skill ${overrides.id}`,
    summary: overrides.summary ?? `Summary for ${overrides.id}`,
    uploaderName: overrides.uploaderName ?? "Demo Uploader",
    archivePath: overrides.archivePath ?? "data/uploads/test.zip",
    skillMdPath: overrides.skillMdPath ?? "data/extracted/test-skill.md",
    readmeStubPath: overrides.readmeStubPath ?? "data/generated/test-readme.md",
    likes: overrides.likes ?? 0,
    downloads: overrides.downloads ?? 0,
    createdAt: overrides.createdAt ?? "2026-03-18T00:00:00.000Z",
    visibility: overrides.visibility ?? "public",
    sharedWith: overrides.sharedWith ?? [],
  };
}
