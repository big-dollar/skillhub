import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type {
  CreateSkillRecordInput,
  ListSkillsOptions,
  SkillRecord,
  SkillStore,
  SortField,
  SharedUser,
} from "@/lib/skills/types";

const EMPTY_STORE: SkillStore = { skills: [] };

export interface ISkillRepository {
  list(options?: ListSkillsOptions, userId?: string | number | null): Promise<SkillRecord[]>;
  getBySlug(slug: string, userId?: string | number | null): Promise<SkillRecord | null>;
  getById(id: string, userId?: string | number | null): Promise<SkillRecord | null>;
  getByUploader(uploaderId: number | string): Promise<SkillRecord[]>;
  create(input: CreateSkillRecordInput): Promise<SkillRecord>;
  update(id: string, input: Partial<SkillRecord>): Promise<SkillRecord>;
  delete(id: string): Promise<void>;
  incrementLikes(id: string): Promise<SkillRecord>;
  incrementDownloads(id: string): Promise<SkillRecord>;
  shareSkill(skillId: string, userId: string | number, userName: string, userAvatar: string): Promise<SkillRecord>;
  removeShare(skillId: string, userId: string | number): Promise<SkillRecord>;
}

export class SkillRepository implements ISkillRepository {
  private readonly rootDir: string;
  private readonly filePath: string;

  constructor(rootDir: string) {
    this.rootDir = path.isAbsolute(rootDir) ? rootDir : path.join(process.cwd(), rootDir);
    this.filePath = path.join(this.rootDir, "skills.json");
  }

  async list(options: ListSkillsOptions = {}, userId?: string | number | null): Promise<SkillRecord[]> {
    const store = await this.readStore();

    return sortSkills(
      store.skills.filter((skill) => matchesQuery(skill, options.q) && this.canAccessSkill(skill, userId)),
      options.sort ?? "likes",
    );
  }

  async getBySlug(slug: string, userId?: string | number | null): Promise<SkillRecord | null> {
    const store = await this.readStore();
    const skill = store.skills.find((skill) => skill.slug === slug) ?? null;
    
    if (skill && !this.canAccessSkill(skill, userId)) {
      return null;
    }
    
    return skill;
  }

  async getById(id: string, userId?: string | number | null): Promise<SkillRecord | null> {
    const store = await this.readStore();
    const skill = store.skills.find((skill) => skill.id === id) ?? null;
    
    if (skill && !this.canAccessSkill(skill, userId)) {
      return null;
    }
    
    return skill;
  }

  async getByUploader(uploaderId: number | string): Promise<SkillRecord[]> {
    const store = await this.readStore();
    return store.skills.filter((skill) => 
      skill.uploaderGitHubId === uploaderId || 
      skill.uploaderName === uploaderId ||
      skill.uploaderId === uploaderId
    );
  }

  async create(input: CreateSkillRecordInput): Promise<SkillRecord> {
    const store = await this.readStore();
    const record: SkillRecord = {
      ...input,
      likes: input.likes ?? 0,
      downloads: input.downloads ?? 0,
      visibility: input.visibility ?? "public",
      sharedWith: input.sharedWith ?? [],
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

  async update(id: string, updates: Partial<SkillRecord>): Promise<SkillRecord> {
    const store = await this.readStore();
    const index = store.skills.findIndex((skill) => skill.id === id);

    if (index === -1) {
      throw new Error("Skill not found");
    }

    const updatedSkill: SkillRecord = {
      ...store.skills[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    store.skills[index] = updatedSkill;
    await this.writeStore(store);

    return updatedSkill;
  }

  async delete(id: string): Promise<void> {
    const store = await this.readStore();
    const index = store.skills.findIndex((skill) => skill.id === id);

    if (index === -1) {
      throw new Error("Skill not found");
    }

    store.skills.splice(index, 1);
    await this.writeStore(store);
  }

  async shareSkill(skillId: string, userId: string | number, userName: string, userAvatar: string): Promise<SkillRecord> {
    const store = await this.readStore();
    const index = store.skills.findIndex((skill) => skill.id === skillId);

    if (index === -1) {
      throw new Error("Skill not found");
    }

    const skill = store.skills[index];
    const sharedWith = skill.sharedWith ?? [];
    
    // Check if already shared
    if (sharedWith.some((u) => u.id === userId)) {
      return skill;
    }

    const newSharedUser: SharedUser = {
      id: userId,
      name: userName,
      avatar_url: userAvatar,
      sharedAt: new Date().toISOString(),
    };

    const updatedSkill: SkillRecord = {
      ...skill,
      sharedWith: [...sharedWith, newSharedUser],
    };

    store.skills[index] = updatedSkill;
    await this.writeStore(store);

    return updatedSkill;
  }

  async removeShare(skillId: string, userId: string | number): Promise<SkillRecord> {
    const store = await this.readStore();
    const index = store.skills.findIndex((skill) => skill.id === skillId);

    if (index === -1) {
      throw new Error("Skill not found");
    }

    const skill = store.skills[index];
    const sharedWith = skill.sharedWith ?? [];

    const updatedSkill: SkillRecord = {
      ...skill,
      sharedWith: sharedWith.filter((u) => u.id !== userId),
    };

    store.skills[index] = updatedSkill;
    await this.writeStore(store);

    return updatedSkill;
  }

  async save(skills: SkillRecord[]): Promise<void> {
    await this.writeStore({ skills });
  }

  private canAccessSkill(skill: SkillRecord, userId?: string | number | null): boolean {
    // Public skills (or undefined visibility for backward compatibility) are accessible to everyone
    if (skill.visibility === "public" || !skill.visibility) {
      return true;
    }

    // If no user is logged in, they can't access private skills
    if (!userId) {
      return false;
    }

    // Check if user is the uploader
    if (skill.uploaderId === userId || skill.uploaderGitHubId === userId || skill.uploaderName === userId) {
      return true;
    }

    // Check if user is in shared list
    if (skill.sharedWith?.some((u) => u.id === userId)) {
      return true;
    }

    return false;
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
