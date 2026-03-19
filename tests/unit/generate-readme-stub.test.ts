// @vitest-environment node

import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import { createReadmeStub, generateReadmeStub } from "@/lib/ingestion/generate-readme-stub";
import { cleanupTempDir, createTempDir } from "../fixtures/temp-dir";

describe("generateReadmeStub", () => {
  it("generates stub content with title and disclaimer", () => {
    const stub = createReadmeStub("# Heading\n\nFirst paragraph", "My Skill");

    expect(stub).toContain("# My Skill");
    expect(stub).toContain("AI 生成的 README 草稿");
    expect(stub).toContain("First paragraph");
  });

  it("writes a stub file and handles empty content", async () => {
    const tempDir = await createTempDir();
    const stubPath = await generateReadmeStub("", "Empty Skill", tempDir);

    await expect(readFile(stubPath, "utf8")).resolves.toContain("No description available.");
    await cleanupTempDir(tempDir);
  });
});
