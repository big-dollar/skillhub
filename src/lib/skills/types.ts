export interface SkillAuthor {
  id: number;
  login: string;
  name: string | null;
  avatar_url: string;
}

export interface SkillRecord {
  id: string;
  slug: string;
  title: string;
  summary: string;
  description?: string;
  uploaderName: string;
  uploaderAvatar?: string;
  uploaderGitHubId?: number;
  archivePath: string;
  skillMdPath: string;
  readmeStubPath: string;
  likes: number;
  downloads: number;
  createdAt: string;
  updatedAt?: string;
  version?: string;
  tags?: string[];
}

export type SortField = "likes" | "downloads" | "newest";

export interface ListSkillsOptions {
  q?: string;
  sort?: SortField;
}

export interface CreateSkillInput {
  title: string;
  summary: string;
  description?: string;
  uploaderName: string;
  uploaderAvatar?: string;
  uploaderGitHubId?: number;
  archivePath: string;
  skillMdPath: string;
  readmeStubPath: string;
  likes?: number;
  downloads?: number;
  createdAt?: string;
  updatedAt?: string;
  version?: string;
  tags?: string[];
}

export interface CreateSkillRecordInput extends CreateSkillInput {
  id: string;
  slug: string;
  likes?: number;
  downloads?: number;
  createdAt: string;
}

export interface SkillStore {
  skills: SkillRecord[];
}
