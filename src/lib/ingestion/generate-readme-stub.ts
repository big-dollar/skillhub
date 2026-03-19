import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

export async function generateReadmeStub(
  skillMdContent: string,
  title: string,
  outputDir: string,
): Promise<string> {
  const stubPath = path.join(outputDir, `${randomUUID()}-README.md`);
  const stubContent = createReadmeStub(skillMdContent, title);

  await mkdir(outputDir, { recursive: true });
  await writeFile(stubPath, stubContent, "utf8");

  return stubPath;
}

export function createReadmeStub(skillMdContent: string, title: string): string {
  const firstParagraph = skillMdContent
    .replace(/^#+\s.*$/gm, "")
    .split(/\r?\n\s*\r?\n/)
    .map((chunk) => chunk.trim())
    .find(Boolean)
    ?.slice(0, 500);

  return `# ${title}

> AI 生成的 README 草稿

## 概览

${firstParagraph ?? "No description available."}

## 内容

这个 skill 压缩包包含：
- \`SKILL.md\` - skill 文档与使用说明

---

*这个 README 根据 SKILL.md 自动生成，请按需检查和补充。*
`;
}
