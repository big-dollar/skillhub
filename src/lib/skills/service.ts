import { randomUUID } from "node:crypto";
import type { CreateSkillInput, SkillRecord, SortField } from "@/lib/skills/types";
import type { ISkillRepository } from "@/lib/skills/repository";

export class SkillService {
  constructor(private readonly repository: ISkillRepository) {}

  async searchSkills(query?: string, sort: SortField = "likes"): Promise<SkillRecord[]> {
    return this.repository.list({ q: query, sort });
  }

  async getSkillBySlug(slug: string): Promise<SkillRecord | null> {
    return this.repository.getBySlug(slug);
  }

  async getSkillById(id: string): Promise<SkillRecord | null> {
    return this.repository.getById(id);
  }

  async createSkill(input: CreateSkillInput): Promise<SkillRecord> {
    const existingSlugs = (await this.repository.list()).map((skill) => skill.slug);
    const createdAt = input.createdAt ?? new Date().toISOString();

    return this.repository.create({
      ...input,
      id: randomUUID(),
      slug: generateSlug(input.title, existingSlugs),
      likes: input.likes ?? 0,
      downloads: input.downloads ?? 0,
      description: input.description ?? input.summary,
      createdAt,
      updatedAt: input.updatedAt ?? createdAt,
    });
  }

  async likeSkill(id: string): Promise<SkillRecord> {
    return this.repository.incrementLikes(id);
  }

  async recordDownload(id: string): Promise<SkillRecord> {
    return this.repository.incrementDownloads(id);
  }
}

export function generateSlug(title: string, existingSlugs: string[]): string {
  const baseSlug = title
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-") || "skill";

  if (!existingSlugs.includes(baseSlug)) {
    return baseSlug;
  }

  let suffix = 2;
  let candidate = `${baseSlug}-${suffix}`;

  while (existingSlugs.includes(candidate)) {
    suffix += 1;
    candidate = `${baseSlug}-${suffix}`;
  }

  return candidate;
}

export function matchesSearch(skill: SkillRecord, query: string): boolean {
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) {
    return true;
  }

  return [skill.title, skill.summary].some((value) => value.toLowerCase().includes(normalizedQuery));
}
