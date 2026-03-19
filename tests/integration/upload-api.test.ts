// @vitest-environment node

import { access } from "node:fs/promises";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { POST } from "@/app/api/skills/upload/route";
import { buildRequestCookieHeader, createSession } from "@/lib/auth/session";
import { SkillRepository } from "@/lib/skills/repository";
import { cleanupTempDir, createTempDir } from "../fixtures/temp-dir";
import { createZipBuffer } from "../fixtures/archive";
import type { GitHubUser } from "@/lib/auth/types";

const mockUser: GitHubUser = {
  id: 123456,
  login: "demo-uploader",
  name: "Demo Uploader",
  avatar_url: "https://avatars.githubusercontent.com/u/123456?v=4",
  email: "demo@example.com",
};

describe("POST /api/skills/upload", () => {
  let tempDir = "";
  let repository: SkillRepository;

  beforeEach(async () => {
    tempDir = await createTempDir();
    process.env.DATA_DIR = tempDir;
    repository = new SkillRepository(tempDir);
  });

  afterEach(async () => {
    delete process.env.DATA_DIR;
    await cleanupTempDir(tempDir);
  });

  it("creates a skill from a valid authenticated upload", async () => {
    const formData = new FormData();
    formData.set("title", "Uploaded Skill");
    formData.set("summary", "Summary from upload");
    formData.set(
      "file",
      new File([createZipBuffer({ "package/SKILL.md": "# Uploaded Skill\n\nOverview paragraph" })], "skill.zip", {
        type: "application/zip",
      }),
    );

    const request = new Request("http://localhost/api/skills/upload", {
      method: "POST",
      body: formData,
      headers: {
        cookie: buildRequestCookieHeader(createSession({ user: mockUser })),
      },
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      success: true,
      skill: { title: "Uploaded Skill", uploaderName: "Demo Uploader", likes: 0, downloads: 0 },
    });

    const savedSkill = await repository.getById(body.skill.id);
    expect(savedSkill).not.toBeNull();

    await expect(access(path.resolve(process.cwd(), body.skill.archivePath))).resolves.toBeUndefined();
    await expect(access(path.resolve(process.cwd(), body.skill.skillMdPath))).resolves.toBeUndefined();
    await expect(access(path.resolve(process.cwd(), body.skill.readmeStubPath))).resolves.toBeUndefined();
  });

  it("rejects anonymous and invalid uploads", async () => {
    const anonymous = await POST(
      new Request("http://localhost/api/skills/upload", { method: "POST", body: new FormData() }),
    );
    expect(anonymous.status).toBe(401);

    const missingSkillMdForm = new FormData();
    missingSkillMdForm.set("title", "Broken Upload");
    missingSkillMdForm.set("summary", "Missing skill file");
    missingSkillMdForm.set(
      "file",
      new File([createZipBuffer({ "README.md": "missing" })], "broken.zip", { type: "application/zip" }),
    );

    const invalidRequest = new Request("http://localhost/api/skills/upload", {
      method: "POST",
      body: missingSkillMdForm,
      headers: {
        cookie: buildRequestCookieHeader(createSession({ user: mockUser })),
      },
    });
    const invalidResponse = await POST(invalidRequest);

    expect(invalidResponse.status).toBe(400);
    await expect(invalidResponse.json()).resolves.toMatchObject({
      success: false,
      code: "MISSING_SKILL_MD",
    });
  });
});
