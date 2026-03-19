import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type {
  CreateSkillRecordInput,
  ListSkillsOptions,
  SkillRecord,
  SkillStore,
  SortField,
} from "@/lib/skills/types";

const EMPTY_STORE: SkillStore = { skills: [] };

export interface ISkillRepository {
  list(options?: ListSkillsOptions): Promise<SkillRecord[]>;
  getBySlug(slug: string): Promise<SkillRecord | null>;
  getById(id: string): Promise<SkillRecord | null>;
  create(input: CreateSkillRecordInput): Promise<SkillRecord>;
  incrementLikes(id: string): Promise<SkillRecord>;
  incrementDownloads(id: string): Promise<SkillRecord>;
}

export class SkillRepository implements ISkillRepository {
  private readonly rootDir: string;
  private readonly filePath: string;

  constructor(rootDir: string) {
    this.rootDir = path.isAbsolute(rootDir) ? rootDir : path.join(process.cwd(), rootDir);
    this.filePath = path.join(this.rootDir, "skills.json");
  }

  async list(options: ListSkillsOptions = {}): Promise<SkillRecord[]> {
    const store = await this.readStore();

    return sortSkills(
      store.skills.filter((skill) => matchesQuery(skill, options.q)),
      options.sort ?? "likes",
    );
  }

  async getBySlug(slug: string): Promise<SkillRecord | null> {
    const store = await this.readStore();
    return store.skills.find((skill) => skill.slug === slug) ?? null;
  }

  async getById(id: string): Promise<SkillRecord | null> {
    const store = await this.readStore();
    return store.skills.find((skill) => skill.id === id) ?? null;
  }

  async create(input: CreateSkillRecordInput): Promise<SkillRecord> {
    const store = await this.readStore();
    const record: SkillRecord = {
      ...input,
      likes: input.likes ?? 0,
      downloads: input.downloads ?? 0,
    };

    store.skills.push(record);
    await this.writeStore(store);

    return record;
  }

  async incrementLikes(id: string): Promise<SkillRecord> {
    return this.incrementCounter(id, "likes");
  }

  async incrementDownloads(id: string): Promise<SkillRecord> {
    return this.incrementCounter(id, "downloads");
  }

  async save(skills: SkillRecord[]): Promise<void> {
    await this.writeStore({ skills });
  }

  private async incrementCounter(id: string, field: "likes" | "downloads"): Promise<SkillRecord> {
    const store = await this.readStore();
    const index = store.skills.findIndex((skill) => skill.id === id);

    if (index === -1) {
      throw new Error("Skill not found");
    }

    const updatedSkill: SkillRecord = {
      ...store.skills[index],
      [field]: store.skills[index][field] + 1,
    };

    store.skills[index] = updatedSkill;
    await this.writeStore(store);

    return updatedSkill;
  }

  private async writeStore(store: SkillStore): Promise<void> {
    await mkdir(this.rootDir, { recursive: true });
    await writeFile(this.filePath, JSON.stringify(store, null, 2), "utf8");
  }

  private async readStore(): Promise<SkillStore> {
    try {
      const raw = await readFile(this.filePath, "utf8");
      const parsed = JSON.parse(raw) as Partial<SkillStore>;

      return {
        skills: Array.isArray(parsed.skills) ? parsed.skills : EMPTY_STORE.skills,
      };
    } catch (error) {
      if (isMissingFileError(error)) {
        return EMPTY_STORE;
      }

      throw error;
    }
  }
}

function matchesQuery(skill: SkillRecord, query?: string): boolean {
  const normalizedQuery = query?.trim().toLowerCase();

  if (!normalizedQuery) {
    return true;
  }

  const searchableValues = [
    skill.title,
    skill.summary,
    skill.description,
    ...(skill.tags ?? []),
  ].filter((value): value is string => typeof value === "string");

  return searchableValues.some((value) => value.toLowerCase().includes(normalizedQuery));
}

function sortSkills(skills: SkillRecord[], sort: SortField): SkillRecord[] {
  return [...skills].sort((left, right) => {
    if (sort === "newest") {
      const rightDate = Date.parse(right.updatedAt ?? right.createdAt);
      const leftDate = Date.parse(left.updatedAt ?? left.createdAt);
      return rightDate - leftDate;
    }

    const countDelta = right[sort] - left[sort];

    if (countDelta !== 0) {
      return countDelta;
    }

    return Date.parse(right.createdAt) - Date.parse(left.createdAt);
  });
}

function isMissingFileError(error: unknown): error is NodeJS.ErrnoException {
  return typeof error === "object" && error !== null && "code" in error && error.code === "ENOENT";
}
