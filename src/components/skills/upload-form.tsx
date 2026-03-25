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
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [visibility, setVisibility] = useState<"public" | "private">("public");

  const handleAddTag = () => {
    const trimmedTag = tagInput.trim();
    if (trimmedTag && !tags.includes(trimmedTag)) {
      setTags([...tags, trimmedTag]);
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handleSubmit = async (formData: FormData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      // Add tags and visibility to form data
      tags.forEach((tag) => {
        formData.append("tags", tag);
      });
      formData.append("visibility", visibility);

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
          技能 标题
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
          placeholder="请描述这个 技能 的用途，以及开发者应在什么场景下使用它。"
          required
        />
      </div>

      {/* Tags Input */}
      <div className="space-y-2">
        <label className="text-sm font-medium">
          标签
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={handleTagKeyDown}
            placeholder="输入标签并按回车添加"
            className="flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          />
          <button
            type="button"
            onClick={handleAddTag}
            className="rounded-md bg-muted px-4 py-2 text-sm font-medium transition-colors hover:bg-muted/80"
          >
            添加
          </button>
        </div>
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2.5 py-1 text-sm text-primary"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => handleRemoveTag(tag)}
                  className="hover:text-primary/70"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Visibility Selection */}
      <div className="space-y-2">
        <label className="text-sm font-medium">
          可见性
        </label>
        <div className="flex gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="visibility"
              value="public"
              checked={visibility === "public"}
              onChange={(e) => setVisibility(e.target.value as "public" | "private")}
              className="h-4 w-4"
            />
            <span className="text-sm">公开 - 所有人可见</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="visibility"
              value="private"
              checked={visibility === "private"}
              onChange={(e) => setVisibility(e.target.value as "public" | "private")}
              className="h-4 w-4"
            />
            <span className="text-sm">私有 - 仅自己和被分享者可见</span>
          </label>
        </div>
      </div>

      <div className="space-y-3">
        <label className="text-sm font-medium" htmlFor="file">
          技能 ZIP
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
          {isSubmitting ? "发布中..." : "发布 技能"}
        </button>
      </div>
    </form>
  );
}
