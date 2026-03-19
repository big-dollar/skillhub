import { describe, expect, it } from "vitest";
import { SkillService } from "@/lib/skills/service";
import { SkillRepository } from "@/lib/skills/repository";
import { cleanupTempDir, createTempDir } from "../fixtures/temp-dir";

describe("SkillService", () => {
  it("searches skills by query", async () => {
    const tempDir = await createTempDir();
    const repository = new SkillRepository(tempDir);
    const service = new SkillService(repository);

    await service.createSkill({
      title: "React Search",
      summary: "Useful hooks",
      uploaderName: "Demo Uploader",
      archivePath: "data/uploads/react.zip",
      skillMdPath: "data/extracted/react.md",
      readmeStubPath: "data/generated/react-readme.md",
    });

    await service.createSkill({
      title: "CLI Search",
      summary: "Terminal helpers",
      uploaderName: "Demo Uploader",
      archivePath: "data/uploads/cli.zip",
      skillMdPath: "data/extracted/cli.md",
      readmeStubPath: "data/generated/cli-readme.md",
    });

    await expect(service.searchSkills("hooks")).resolves.toMatchObject([{ title: "React Search" }]);
    await cleanupTempDir(tempDir);
  });

  it("creates unique slugs for duplicate titles", async () => {
    const tempDir = await createTempDir();
    const service = new SkillService(new SkillRepository(tempDir));

    const first = await service.createSkill({
      title: "My Skill",
      summary: "One",
      uploaderName: "Demo Uploader",
      archivePath: "data/uploads/one.zip",
      skillMdPath: "data/extracted/one.md",
      readmeStubPath: "data/generated/one.md",
    });
    const second = await service.createSkill({
      title: "My Skill",
      summary: "Two",
      uploaderName: "Demo Uploader",
      archivePath: "data/uploads/two.zip",
      skillMdPath: "data/extracted/two.md",
      readmeStubPath: "data/generated/two.md",
    });

    expect(first.slug).toBe("my-skill");
    expect(second.slug).toBe("my-skill-2");
    await cleanupTempDir(tempDir);
  });
});
