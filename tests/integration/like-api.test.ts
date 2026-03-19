// @vitest-environment node

import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { POST } from "@/app/api/skills/[id]/like/route";
import { SkillRepository } from "@/lib/skills/repository";
import { cleanupTempDir, createTempDir } from "../fixtures/temp-dir";
import { createSkillRecord } from "../fixtures/skill-record";

describe("POST /api/skills/{id}/like", () => {
  let tempDir = "";
  let repository: SkillRepository;

  beforeEach(async () => {
    tempDir = await createTempDir();
    process.env.DATA_DIR = tempDir;
    repository = new SkillRepository(tempDir);
    await repository.save([createSkillRecord({ id: "skill-1", likes: 5 })]);
  });

  afterEach(async () => {
    delete process.env.DATA_DIR;
    await cleanupTempDir(tempDir);
  });

  it("increments the like count and returns the updated skill", async () => {
    const response = await POST(new Request("http://localhost"), {
      params: Promise.resolve({ id: "skill-1" }),
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({ success: true, likes: 6, skill: { id: "skill-1", likes: 6 } });
    await expect(repository.getById("skill-1")).resolves.toMatchObject({ likes: 6 });
  });

  it("returns 404 for a missing skill", async () => {
    const response = await POST(new Request("http://localhost"), {
      params: Promise.resolve({ id: "missing" }),
    });

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toMatchObject({ success: false, error: "Skill not found" });
  });
});
