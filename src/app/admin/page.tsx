"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Stats {
  totalSkills: number;
  publicSkills: number;
  privateSkills: number;
  totalUsers: number;
  totalLikes: number;
  totalDownloads: number;
  recentSkills: Array<{
    id: string;
    title: string;
    uploaderName: string;
    createdAt: string;
    visibility?: "public" | "private";
  }>;
  topUploaders: Array<{
    userId: string;
    name: string;
    avatar: string;
    count: number;
  }>;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/admin/stats");
      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          router.push("/");
          return;
        }
        if (response.status === 403) {
          setError("您没有管理员权限");
          return;
        }
        throw new Error(data.error || "获取统计数据失败");
      }

      setStats(data.stats);
    } catch (err) {
      setError(err instanceof Error ? err.message : "获取统计数据失败");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="text-center py-12">
            <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto"></div>
            <p className="mt-4 text-muted-foreground">加载中...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="text-center py-12">
            <p className="text-red-500 text-lg">{error}</p>
            <Link href="/" className="mt-4 text-primary hover:underline inline-block">
              返回首页
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">管理后台</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">系统概览与统计</p>
            </div>
            <Link
              href="/"
              className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white flex items-center gap-1"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="m15 18-6-6 6-6"/>
              </svg>
              返回首页
            </Link>
          </div>
        </div>

        {/* Navigation Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Link
            href="/admin/skills"
            className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-600 dark:text-blue-400">
                  <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
                  <polyline points="14 2 14 8 20 8"/>
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">技能管理</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">查看和管理所有技能</p>
              </div>
            </div>
          </Link>

          <Link
            href="/admin/users"
            className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-green-600 dark:text-green-400">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                  <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">用户管理</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">查看所有注册用户</p>
              </div>
            </div>
          </Link>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-purple-600 dark:text-purple-400">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" x2="12" y1="16" y2="12"/>
                  <line x1="12" x2="12.01" y1="8" y2="8"/>
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">系统状态</h3>
                <p className="text-sm text-green-600 dark:text-green-400">运行正常</p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <p className="text-sm text-gray-600 dark:text-gray-400">总技能数</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats.totalSkills}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <p className="text-sm text-gray-600 dark:text-gray-400">公开技能</p>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">{stats.publicSkills}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <p className="text-sm text-gray-600 dark:text-gray-400">私有技能</p>
            <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">{stats.privateSkills}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <p className="text-sm text-gray-600 dark:text-gray-400">注册用户</p>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">{stats.totalUsers}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <p className="text-sm text-gray-600 dark:text-gray-400">总点赞数</p>
            <p className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">{stats.totalLikes}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <p className="text-sm text-gray-600 dark:text-gray-400">总下载数</p>
            <p className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-1">{stats.totalDownloads}</p>
          </div>
        </div>

        {/* Recent Skills */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 mb-8">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">最近上传的技能</h2>
          </div>
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {stats.recentSkills.map((skill) => (
              <div key={skill.id} className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">{skill.title}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    由 {skill.uploaderName} 上传于 {new Date(skill.createdAt).toLocaleDateString("zh-CN")}
                  </p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  skill.visibility === "private"
                    ? "bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200"
                    : "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200"
                }`}>
                  {skill.visibility === "private" ? "私有" : "公开"}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Uploaders */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">活跃上传者</h2>
          </div>
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {stats.topUploaders.map((uploader, index) => (
              <div key={uploader.userId} className="p-4 flex items-center gap-4">
                <span className="text-lg font-bold text-gray-400 w-8">#{index + 1}</span>
                <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700">
                  {uploader.avatar ? (
                    <img src={uploader.avatar} alt={uploader.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-500">
                      {uploader.name.charAt(0)}
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900 dark:text-white">{uploader.name}</p>
                </div>
                <span className="text-sm text-gray-600 dark:text-gray-400">{uploader.count} 个技能</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
