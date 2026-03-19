// @vitest-environment node

import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import { extractSkillMd, MAX_ARCHIVE_BYTES } from "@/lib/ingestion/extract-skill-md";
import { cleanupTempDir, createTempDir } from "../fixtures/temp-dir";
import { createZipBuffer } from "../fixtures/archive";

describe("extractSkillMd", () => {
  it("extracts SKILL.md from a valid archive", async () => {
    const tempDir = await createTempDir();
    const result = await extractSkillMd(
      createZipBuffer({ "nested/SKILL.md": "# Skill\n\nFirst paragraph" }),
      "skill.zip",
      tempDir,
    );

    expect("skillMdContent" in result && result.skillMdContent).toContain("First paragraph");

    if ("skillMdPath" in result) {
      await expect(readFile(result.skillMdPath, "utf8")).resolves.toContain("# Skill");
    }

    await cleanupTempDir(tempDir);
  });

  it("returns an error when SKILL.md is missing", async () => {
    const tempDir = await createTempDir();
    const result = await extractSkillMd(createZipBuffer({ "README.md": "missing" }), "skill.zip", tempDir);

    expect(result).toMatchObject({ success: false, code: "MISSING_SKILL_MD" });
    await cleanupTempDir(tempDir);
  });

  it("returns an error for invalid file types and oversize archives", async () => {
    const tempDir = await createTempDir();

    await expect(extractSkillMd(Buffer.from("plain"), "skill.txt", tempDir)).resolves.toMatchObject({
      success: false,
      code: "INVALID_FILE",
    });

    await expect(
      extractSkillMd(Buffer.alloc(MAX_ARCHIVE_BYTES + 1), "skill.zip", tempDir),
    ).resolves.toMatchObject({ success: false, code: "INVALID_SIZE" });

    await cleanupTempDir(tempDir);
  });

  it("finds SKILL.md case-insensitively", async () => {
    const tempDir = await createTempDir();
    const result = await extractSkillMd(createZipBuffer({ "Skill.md": "Hello" }), "skill.zip", tempDir);

    expect(result).toMatchObject({ skillMdContent: "Hello" });
    await cleanupTempDir(tempDir);
  });
});
