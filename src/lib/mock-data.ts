import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import AdmZip from "adm-zip";
import { SkillRepository } from "@/lib/skills/repository";
import { SkillService } from "@/lib/skills/service";

export interface User {
  id: string;
  name: string;
  avatarUrl?: string;
}

export interface Skill {
  id: string;
  slug: string;
  title: string;
  description: string;
  author: User;
  likes: number;
  downloads: number;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  version: string;
  readmeContent: string;
}

type HomeSort = "likes" | "newest" | "downloads";

interface DemoSkillSeed {
  title: string;
  description: string;
  uploaderName: string;
  likes: number;
  downloads: number;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  version: string;
  skillMdContent: string;
}

const demoSkillSeeds: DemoSkillSeed[] = [
  {
    title: "React Server Components Mastery",
    description:
      "A comprehensive guide and set of patterns for mastering React Server Components in Next.js App Router. Includes advanced caching strategies and streaming examples.",
    uploaderName: "Alice Dev",
    likes: 124,
    downloads: 890,
    tags: ["react", "nextjs", "rsc", "performance"],
    createdAt: "2023-10-15T08:00:00Z",
    updatedAt: "2024-01-20T14:30:00Z",
    version: "1.2.0",
    skillMdContent:
      "# React Server Components Mastery\n\nLearn production-ready RSC patterns for data fetching, streaming, cache boundaries, and component composition in Next.js App Router.\n\n## Use cases\n\n- Large content-heavy products\n- Streaming-first user experiences\n- Reducing client bundle size\n\n## Installation\n\nCopy the skill folder into your workspace and follow the examples.",
  },
  {
    title: "Tailwind CSS Pro Tips",
    description:
      "Learn how to build complex, responsive, and beautiful UIs with Tailwind CSS. Covers arbitrary values, custom plugins, and dark mode.",
    uploaderName: "Bob Coder",
    likes: 342,
    downloads: 2100,
    tags: ["css", "tailwind", "design"],
    createdAt: "2023-11-02T10:15:00Z",
    updatedAt: "2023-12-05T09:45:00Z",
    version: "2.0.1",
    skillMdContent:
      "# Tailwind CSS Pro Tips\n\nA field guide to reusable Tailwind patterns, component ergonomics, and theming conventions for polished interfaces.\n\n## Includes\n\n- Layout recipes\n- Color system guidance\n- Accessibility-friendly utility combinations",
  },
  {
    title: "TypeScript Advanced Types",
    description:
      "Deep dive into utility types, mapped types, conditional types, and template literal types to write robust and type-safe code.",
    uploaderName: "Alice Dev",
    likes: 89,
    downloads: 450,
    tags: ["typescript", "types"],
    createdAt: "2024-02-10T16:20:00Z",
    updatedAt: "2024-02-15T11:00:00Z",
    version: "1.0.0",
    skillMdContent:
      "# TypeScript Advanced Types\n\nPractical patterns for mapped types, discriminated unions, template literal types, and API-safe generic helpers.",
  },
  {
    title: "Framer Motion Animations",
    description:
      "Add beautiful, fluid animations to your React apps. Covers layout animations, gesture recognition, and scroll-linked effects.",
    uploaderName: "Charlie Hacker",
    likes: 512,
    downloads: 3200,
    tags: ["react", "animation", "motion"],
    createdAt: "2023-09-05T13:40:00Z",
    updatedAt: "2024-03-01T10:00:00Z",
    version: "3.1.4",
    skillMdContent:
      "# Framer Motion Animations\n\nA compact set of motion patterns for product teams that want tasteful movement without UI bloat.\n\n## Includes\n\n- Layout transitions\n- Scroll reveals\n- Gesture interactions",
  },
  {
    title: "GraphQL Apollo Client Setup",
    description:
      "Best practices for configuring Apollo Client in a Next.js application, including SSR support and state management.",
    uploaderName: "Bob Coder",
    likes: 67,
    downloads: 310,
    tags: ["graphql", "apollo", "nextjs"],
    createdAt: "2024-01-25T09:00:00Z",
    updatedAt: "2024-01-28T15:20:00Z",
    version: "1.1.2",
    skillMdContent:
      "# GraphQL Apollo Client Setup\n\nAn opinionated starter for Apollo Client in modern Next.js apps with SSR-aware caching and error boundaries.",
  },
  {
    title: "Zod Validation Patterns",
    description:
      "Reusable Zod schemas for forms, API responses, and environment variables. Ensure runtime type safety across your stack.",
    uploaderName: "Alice Dev",
    likes: 210,
    downloads: 1500,
    tags: ["zod", "validation", "typescript"],
    createdAt: "2023-12-12T11:30:00Z",
    updatedAt: "2024-02-05T08:15:00Z",
    version: "2.0.0",
    skillMdContent:
      "# Zod Validation Patterns\n\nA reusable schema library for request validation, form contracts, and configuration parsing with clean developer ergonomics.",
  },
];

export async function getSkills(query?: string, sort: HomeSort = "likes", userId?: string | number): Promise<Skill[]> {
  const { repository } = await ensureDemoData();
  const records = await repository.list({ q: query, sort }, userId);
  return Promise.all(records.map((record) => toSkill(record)));
}

export async function getSkillBySlug(slug: string, userId?: string | number): Promise<Skill | null> {
  const { repository } = await ensureDemoData();
  const record = await repository.getBySlug(slug, userId);
  return record ? toSkill(record) : null;
}

async function ensureDemoData() {
  const dataDir = resolveDataDir();
  const repository = new SkillRepository(dataDir);
  const service = new SkillService(repository);

  if ((await repository.list()).length > 0) {
    return { dataDir, repository, service };
  }

  const uploadsDir = path.join(dataDir, "uploads");
  const extractedDir = path.join(dataDir, "extracted");
  const generatedDir = path.join(dataDir, "generated");
  await Promise.all([
    mkdir(uploadsDir, { recursive: true }),
    mkdir(extractedDir, { recursive: true }),
    mkdir(generatedDir, { recursive: true }),
  ]);

  for (const seed of demoSkillSeeds) {
    const slugBase = slugify(seed.title);
    const archivePath = path.join(uploadsDir, `${slugBase}.zip`);
    const skillMdPath = path.join(extractedDir, `${slugBase}-SKILL.md`);
    const readmeStubPath = path.join(generatedDir, `${slugBase}-README.md`);
    const readmeContent = createSeedReadme(seed);

    await writeFile(skillMdPath, seed.skillMdContent, "utf8");
    await writeFile(readmeStubPath, readmeContent, "utf8");
    await writeArchive(archivePath, seed.skillMdContent, readmeContent);

    await service.createSkill({
      title: seed.title,
      summary: seed.description,
      description: seed.description,
      uploaderName: seed.uploaderName,
      archivePath: path.posix.join(path.posix.relative(process.cwd().replace(/\\/g, '/'), uploadsDir.replace(/\\/g, '/')), `${slugBase}.zip`),
      skillMdPath: path.posix.join(path.posix.relative(process.cwd().replace(/\\/g, '/'), extractedDir.replace(/\\/g, '/')), `${slugBase}-SKILL.md`),
      readmeStubPath: path.posix.join(path.posix.relative(process.cwd().replace(/\\/g, '/'), generatedDir.replace(/\\/g, '/')), `${slugBase}-README.md`),
      likes: seed.likes,
      downloads: seed.downloads,
      createdAt: seed.createdAt,
      updatedAt: seed.updatedAt,
      version: seed.version,
      tags: seed.tags,
    });
  }

  return { dataDir, repository, service };
}

async function toSkill(record: Awaited<ReturnType<SkillService["getSkillById"]>> extends infer T ? Exclude<T, null> : never): Promise<Skill> {
  const normalizedPath = record.readmeStubPath.replace(/\\/g, '/');
  const readmeAbsolutePath = path.resolve(process.cwd(), normalizedPath);
  const readmeContent = await readFile(readmeAbsolutePath, "utf8");

  return {
    id: record.id,
    slug: record.slug,
    title: record.title,
    description: record.description ?? record.summary,
    author: {
      id: record.uploaderGitHubId ? String(record.uploaderGitHubId) : avatarId(record.uploaderName),
      name: record.uploaderName,
      avatarUrl: record.uploaderAvatar ?? `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(record.uploaderName)}`,
    },
    likes: record.likes,
    downloads: record.downloads,
    tags: record.tags ?? [],
    createdAt: record.createdAt,
    updatedAt: record.updatedAt ?? record.createdAt,
    version: record.version ?? "1.0.0",
    readmeContent,
  };
}

async function writeArchive(archivePath: string, skillMdContent: string, readmeContent: string) {
  const archive = new AdmZip();
  archive.addFile("SKILL.md", Buffer.from(skillMdContent, "utf8"));
  archive.addFile("README.md", Buffer.from(readmeContent, "utf8"));
  await writeFile(archivePath, archive.toBuffer());
}

function createSeedReadme(seed: DemoSkillSeed) {
  return `# ${seed.title}\n\n> AI 生成的 README 草稿\n\n## 概览\n\n${seed.description}\n\n## 包含主题\n\n${seed.tags.map((tag) => `- ${tag}`).join("\n")}\n`;
}

function resolveDataDir() {
  const configuredDir = process.env.DATA_DIR ?? "data";
  return path.isAbsolute(configuredDir) ? configuredDir : path.join(process.cwd(), configuredDir);
}

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function avatarId(value: string) {
  return createHash("sha1").update(value).digest("hex").slice(0, 12);
}
