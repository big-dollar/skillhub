"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Skill {
  id: string;
  slug: string;
  title: string;
  summary: string;
  version?: string;
}

export default function EditSkillPage({ params }: { params: Promise<{ slug: string }> }) {
  const router = useRouter();
  const [skillSlug, setSkillSlug] = useState<string>("");
  const [skill, setSkill] = useState<Skill | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Unwrap params
    params.then(({ slug }) => {
      setSkillSlug(slug);
      fetchSkill(slug);
    });
  }, [params]);

  const fetchSkill = async (slug: string) => {
    try {
      const response = await fetch(`/api/skills/by-slug/${slug}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "获取技能信息失败");
      }
      
      setSkill(data.skill);
    } catch (err) {
      setError(err instanceof Error ? err.message : "获取技能信息失败");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const formData = new FormData(e.currentTarget);

    try {
      if (!skill) {
        throw new Error("技能信息未加载");
      }

      const response = await fetch(`/api/skills/${skill.id}/edit`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "更新失败");
      }

      // Redirect to skill detail page
      router.push(`/skills/${data.skill.slug}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "更新失败");
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto"></div>
        <p className="mt-4 text-muted-foreground">加载中...</p>
      </div>
    );
  }

  if (error || !skill) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center">
        <p className="text-red-500">{error || "技能不存在"}</p>
        <Link href="/profile" className="mt-4 text-primary hover:underline">
          返回我的技能
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-8">
      <div className="mb-8">
        <Link
          href="/profile"
          className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 mb-4"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="m15 18-6-6 6-6"/>
          </svg>
          返回我的技能
        </Link>
        <h1 className="font-display text-3xl font-bold mb-2">编辑技能</h1>
        <p className="text-muted-foreground">
          更新技能内容，版本将从 {skill.version || "V1.0.0"} 升级到 {" "}
          <span className="font-medium text-foreground">
            V{(parseInt((skill.version || "V1.0.0").match(/V(\d+)/)?.[1] || "1") + 1)}.0.0
          </span>
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 border border-red-200 bg-red-50 rounded-md text-red-600">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="title">
            技能标题
          </label>
          <input
            className="flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            id="title"
            name="title"
            defaultValue={skill.title}
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
            defaultValue={skill.summary}
            placeholder="请描述这个技能的用途，以及开发者应在什么场景下使用它。"
            required
          />
        </div>

        <div className="space-y-3">
          <label className="text-sm font-medium" htmlFor="file">
            技能 ZIP 文件（重新上传将替换现有文件）
          </label>
          <input
            accept=".zip,application/zip"
            className="block w-full rounded-md border bg-background px-3 py-2 text-sm file:mr-4 file:rounded-md file:border-0 file:bg-primary file:px-4 file:py-2 file:text-primary-foreground"
            id="file"
            name="file"
            type="file"
            required
          />
          <p className="text-sm text-muted-foreground">压缩包必须包含 SKILL.md 文件。</p>
        </div>

        <div className="flex justify-end gap-4 border-t pt-4">
          <Link
            href="/profile"
            className="rounded-md px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
          >
            取消
          </Link>
          <button
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
            disabled={submitting}
            type="submit"
          >
            {submitting ? "更新中..." : "更新技能"}
          </button>
        </div>
      </form>
    </div>
  );
}
