"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Skill {
  id: string;
  slug: string;
  title: string;
  summary: string;
  likes: number;
  downloads: number;
  version?: string;
  createdAt: string;
  updatedAt?: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetchMySkills();
  }, []);

  const fetchMySkills = async () => {
    try {
      const response = await fetch("/api/skills/my");
      const data = await response.json();
      
      if (!response.ok) {
        if (response.status === 401) {
          router.push("/upload");
          return;
        }
        throw new Error(data.error || "获取技能列表失败");
      }
      
      setSkills(data.skills);
    } catch (err) {
      setError(err instanceof Error ? err.message : "获取技能列表失败");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("确定要删除这个技能吗？此操作不可恢复。")) {
      return;
    }

    setDeletingId(id);
    try {
      const response = await fetch(`/api/skills/${id}`, {
        method: "DELETE",
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "删除失败");
      }
      
      // Remove from list
      setSkills(skills.filter((skill) => skill.id !== id));
    } catch (err) {
      alert(err instanceof Error ? err.message : "删除失败");
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-12 text-center">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto"></div>
        <p className="mt-4 text-muted-foreground">加载中...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto py-12 text-center">
        <p className="text-red-500">{error}</p>
        <Link href="/upload" className="mt-4 text-primary hover:underline">
          返回上传页面
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold mb-2">我的技能</h1>
        <p className="text-muted-foreground">
          管理你上传的所有技能
        </p>
      </div>

      {skills.length === 0 ? (
        <div className="text-center py-16 border rounded-xl border-dashed bg-muted/20">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground">
              <path d="M12 5v14M5 12h14"/>
            </svg>
          </div>
          <h3 className="text-xl font-display font-semibold mb-2">还没有上传技能</h3>
          <p className="text-muted-foreground mb-6">分享你的第一个技能给社区</p>
          <Link
            href="/upload"
            className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            上传技能
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {skills.map((skill) => (
            <div
              key={skill.id}
              className="border rounded-lg p-6 hover:border-primary/50 transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-display text-xl font-semibold truncate">
                      <Link href={`/skills/${skill.slug}`} className="hover:text-primary">
                        {skill.title}
                      </Link>
                    </h3>
                    {skill.version && (
                      <span className="text-xs bg-muted px-2 py-1 rounded-full text-muted-foreground">
                        {skill.version}
                      </span>
                    )}
                  </div>
                  <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
                    {skill.summary}
                  </p>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
                      </svg>
                      {skill.likes}
                    </span>
                    <span className="flex items-center gap-1">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                        <polyline points="7 10 12 15 17 10"/>
                        <line x1="12" x2="12" y1="15" y2="3"/>
                      </svg>
                      {skill.downloads}
                    </span>
                    <span>
                      {skill.updatedAt 
                        ? `更新于 ${new Date(skill.updatedAt).toLocaleDateString("zh-CN")}`
                        : `创建于 ${new Date(skill.createdAt).toLocaleDateString("zh-CN")}`
                      }
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Link
                    href={`/skills/${skill.slug}/edit`}
                    className="rounded-md border border-border px-3 py-2 text-sm font-medium transition-colors hover:border-primary hover:text-primary flex items-center gap-1"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                    编辑
                  </Link>
                  <button
                    onClick={() => handleDelete(skill.id)}
                    disabled={deletingId === skill.id}
                    className="rounded-md border border-border px-3 py-2 text-sm font-medium transition-colors hover:border-red-500 hover:text-red-500 flex items-center gap-1 disabled:opacity-50"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="3 6 5 6 21 6"/>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                    </svg>
                    {deletingId === skill.id ? "删除中..." : "删除"}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
