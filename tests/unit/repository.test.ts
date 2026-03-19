import path from "node:path";
import { readFile } from "node:fs/promises";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { SkillRepository } from "@/lib/skills/repository";
import { cleanupTempDir, createTempDir } from "../fixtures/temp-dir";
import { createSkillRecord } from "../fixtures/skill-record";

describe("SkillRepository", () => {
  let tempDir = "";
  let repository: SkillRepository;

  beforeEach(async () => {
    tempDir = await createTempDir();
    repository = new SkillRepository(tempDir);
  });

  afterEach(async () => {
    await cleanupTempDir(tempDir);
  });

  it("returns an empty list when the store file does not exist", async () => {
    await expect(repository.list()).resolves.toEqual([]);
  });

  it("lists skills sorted by likes desc by default", async () => {
    await repository.save([
      createSkillRecord({ id: "older", likes: 2, createdAt: "2026-03-18T00:00:00.000Z" }),
      createSkillRecord({ id: "newer", likes: 2, createdAt: "2026-03-19T00:00:00.000Z" }),
      createSkillRecord({ id: "top", likes: 5 }),
    ]);

    await expect(repository.list()).resolves.toMatchObject([{ id: "top" }, { id: "newer" }, { id: "older" }]);
  });

  it("sorts skills by downloads when specified", async () => {
    await repository.save([
      createSkillRecord({ id: "first", downloads: 3 }),
      createSkillRecord({ id: "second", downloads: 9 }),
    ]);

    await expect(repository.list({ sort: "downloads" })).resolves.toMatchObject([
      { id: "second" },
      { id: "first" },
    ]);
  });

  it("filters skills by a case-insensitive search query", async () => {
    await repository.save([
      createSkillRecord({ id: "react", title: "React Patterns", summary: "Hooks and composition" }),
      createSkillRecord({ id: "other", title: "CLI Tooling", summary: "Shell workflow" }),
    ]);

    await expect(repository.list({ q: "hooks" })).resolves.toMatchObject([{ id: "react" }]);
  });

  it("gets skills by slug and id", async () => {
    await repository.save([createSkillRecord({ id: "skill-1", slug: "vitest-basics" })]);

    await expect(repository.getBySlug("vitest-basics")).resolves.toMatchObject({ id: "skill-1" });
    await expect(repository.getById("skill-1")).resolves.toMatchObject({ slug: "vitest-basics" });
  });

  it("creates skills and increments persisted counters", async () => {
    const created = await repository.create({
      ...createSkillRecord({ id: "created", slug: "created-skill", likes: 0, downloads: 0 }),
    });

    expect(created.slug).toBe("created-skill");

    await expect(repository.incrementLikes(created.id)).resolves.toMatchObject({ likes: 1 });
    await expect(repository.incrementDownloads(created.id)).resolves.toMatchObject({ downloads: 1 });
    await expect(repository.getById(created.id)).resolves.toMatchObject({ likes: 1, downloads: 1 });
  });

  it("persists skills to the temp store and loads them back", async () => {
    const savedSkills = [createSkillRecord({ id: "skill_1", slug: "vitest-basics", likes: 3, downloads: 8 })];

    await repository.save(savedSkills);

    await expect(repository.list()).resolves.toEqual(savedSkills);

    const rawStore = await readFile(path.join(tempDir, "skills.json"), "utf8");
    expect(JSON.parse(rawStore)).toEqual({ skills: savedSkills });
  });

  it("persists data between repository instances", async () => {
    await repository.save([createSkillRecord({ id: "persisted", slug: "persisted-skill" })]);

    const freshRepository = new SkillRepository(tempDir);

    await expect(freshRepository.getBySlug("persisted-skill")).resolves.toMatchObject({ id: "persisted" });
  });
});
