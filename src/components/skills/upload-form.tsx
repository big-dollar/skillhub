"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface UploadResponse {
  success: boolean;
  error?: string;
  skill?: { slug: string };
}

export function UploadForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (formData: FormData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/skills/upload", {
        method: "POST",
        body: formData,
      });

      const payload = (await response.json()) as UploadResponse;

      if (!response.ok || !payload.success || !payload.skill) {
        setError(payload.error ?? "上传失败");
        return;
      }

      router.push(`/skills/${payload.skill.slug}`);
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form action={handleSubmit} className="space-y-8 rounded-xl border bg-card p-6 shadow-sm md:p-8">
      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="title">
          Skill 标题
        </label>
        <input
          className="flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          id="title"
          name="title"
          placeholder="例如：Advanced React Server Components"
          required
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="summary">
          摘要
        </label>
        <textarea
          className="flex min-h-[140px] w-full rounded-md border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          id="summary"
          name="summary"
          placeholder="请描述这个 skill 的用途，以及开发者应在什么场景下使用它。"
          required
        />
      </div>

      <div className="space-y-3">
        <label className="text-sm font-medium" htmlFor="file">
          Skill ZIP
        </label>
        <input
          accept=".zip,application/zip"
          className="block w-full rounded-md border bg-background px-3 py-2 text-sm file:mr-4 file:rounded-md file:border-0 file:bg-primary file:px-4 file:py-2 file:text-primary-foreground"
          id="file"
          name="file"
          required
          type="file"
        />
        <p className="text-sm text-muted-foreground">压缩包必须包含 SKILL.md 文件。</p>
      </div>

      {error ? <p className="text-sm text-red-500">{error}</p> : null}

      <div className="flex justify-end gap-4 border-t pt-4">
        <button className="rounded-md px-4 py-2 text-sm font-medium transition-colors hover:bg-muted" type="reset">
          重置
        </button>
        <button
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
          disabled={isSubmitting}
          type="submit"
        >
          {isSubmitting ? "发布中..." : "发布 Skill"}
        </button>
      </div>
    </form>
  );
}
