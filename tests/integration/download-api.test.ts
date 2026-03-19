// @vitest-environment node

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { GET } from "@/app/api/skills/[id]/download/route";
import { SkillRepository } from "@/lib/skills/repository";
import { cleanupTempDir, createTempDir } from "../fixtures/temp-dir";
import { createSkillRecord } from "../fixtures/skill-record";

describe("GET /api/skills/{id}/download", () => {
  let tempDir = "";
  let repository: SkillRepository;
  let archiveAbsolutePath = "";

  beforeEach(async () => {
    tempDir = await createTempDir();
    process.env.DATA_DIR = tempDir;
    repository = new SkillRepository(tempDir);
    archiveAbsolutePath = path.join(tempDir, "uploads", "skill.zip");
    await mkdir(path.dirname(archiveAbsolutePath), { recursive: true });
    await writeFile(archiveAbsolutePath, Buffer.from("zip-binary"));

    await repository.save([
      createSkillRecord({
        id: "skill-1",
        downloads: 3,
        archivePath: path.relative(process.cwd(), archiveAbsolutePath),
      }),
    ]);
  });

  afterEach(async () => {
    delete process.env.DATA_DIR;
    await cleanupTempDir(tempDir);
  });

  it("returns the file and increments downloads before completing", async () => {
    const response = await GET(new Request("http://localhost"), {
      params: Promise.resolve({ id: "skill-1" }),
    });
    const clonedResponse = response.clone();

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("application/zip");
    expect(response.headers.get("content-disposition")).toContain("attachment;");
    expect(Buffer.from(await clonedResponse.arrayBuffer()).toString("utf8")).toBe("zip-binary");
    await expect(repository.getById("skill-1")).resolves.toMatchObject({ downloads: 4 });
  });

  it("returns 404 for missing skills and files", async () => {
    const missingSkill = await GET(new Request("http://localhost"), {
      params: Promise.resolve({ id: "missing" }),
    });
    expect(missingSkill.status).toBe(404);

    await repository.save([
      createSkillRecord({
        id: "broken",
        archivePath: path.relative(process.cwd(), path.join(tempDir, "uploads", "missing.zip")),
      }),
    ]);

    const missingFile = await GET(new Request("http://localhost"), {
      params: Promise.resolve({ id: "broken" }),
    });
    expect(missingFile.status).toBe(404);
    await expect(missingFile.json()).resolves.toMatchObject({ success: false, error: "File not found" });
  });
});
