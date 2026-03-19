import { describe, expect, it } from "vitest";
import { generateSlug } from "@/lib/skills/service";

describe("generateSlug", () => {
  it("converts titles to kebab-case", () => {
    expect(generateSlug("My Cool Skill", [])).toBe("my-cool-skill");
  });

  it("appends numbers for duplicate slugs", () => {
    expect(generateSlug("My Skill", ["my-skill"])).toBe("my-skill-2");
    expect(generateSlug("My Skill", ["my-skill", "my-skill-2"])).toBe("my-skill-3");
  });

  it("removes special characters", () => {
    expect(generateSlug("Skill: Advanced (2024)!", [])).toBe("skill-advanced-2024");
  });
});
