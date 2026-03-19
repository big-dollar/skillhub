import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

export async function createTempDir(): Promise<string> {
  return mkdtemp(path.join(os.tmpdir(), "skillhub-test-"));
}

export async function cleanupTempDir(tempDir: string): Promise<void> {
  await rm(tempDir, { force: true, recursive: true });
}
