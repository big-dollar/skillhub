"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface SharedUser {
  id: string | number;
  name: string;
  avatar_url: string;
  sharedAt: string;
}

interface Skill {
  id: string;
  title: string;
  visibility: "public" | "private";
  sharedWith?: SharedUser[];
}

interface User {
  id: string | number;
  name: string;
  avatar_url: string;
}

interface ShareDialogProps {
  skill: Skill;
  isOpen: boolean;
  onClose: () => void;
}

export function ShareDialog({ skill, isOpen, onClose }: ShareDialogProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [sharedUsers, setSharedUsers] = useState<SharedUser[]>(skill.sharedWith || []);
  const [isSharing, setIsSharing] = useState<string | number | null>(null);

  // Reset shared users when skill changes
  useEffect(() => {
    setSharedUsers(skill.sharedWith || []);
  }, [skill.sharedWith]);

  // Search users when query changes
  useEffect(() => {
    const searchUsers = async () => {
      if (!searchQuery.trim()) {
        setSearchResults([]);
        return;
      }

      setIsSearching(true);
      try {
        const response = await fetch(`/api/users/search?q=${encodeURIComponent(searchQuery)}`);
        const data = await response.json();
        
        if (data.success) {
          // Filter out already shared users
          const sharedIds = new Set(sharedUsers.map((u) => u.id));
          setSearchResults(data.users.filter((u: User) => !sharedIds.has(u.id)));
        }
      } catch (error) {
        console.error("Failed to search users:", error);
      } finally {
        setIsSearching(false);
      }
    };

    const timeoutId = setTimeout(searchUsers, 300);
    return () => clearTimeout(timeoutId);
  }, [searchQuery, sharedUsers]);

  const handleShare = async (user: User) => {
    setIsSharing(user.id);
    try {
      const response = await fetch(`/api/skills/${skill.id}/share`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          userName: user.name,
          userAvatar: user.avatar_url,
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        setSharedUsers([...sharedUsers, {
          id: user.id,
          name: user.name,
          avatar_url: user.avatar_url,
          sharedAt: new Date().toISOString(),
        }]);
        setSearchQuery("");
        setSearchResults([]);
        router.refresh();
      } else {
        alert(data.error || "分享失败");
      }
    } catch (error) {
      console.error("Failed to share skill:", error);
      alert("分享失败");
    } finally {
      setIsSharing(null);
    }
  };

  const handleRemoveShare = async (userId: string | number) => {
    if (!confirm("确定要取消分享吗？")) {
      return;
    }

    try {
      const response = await fetch(`/api/skills/${skill.id}/share`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });

      const data = await response.json();
      
      if (data.success) {
        setSharedUsers(sharedUsers.filter((u) => u.id !== userId));
        router.refresh();
      } else {
        alert(data.error || "取消分享失败");
      }
    } catch (error) {
      console.error("Failed to remove share:", error);
      alert("取消分享失败");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-gray-900 border rounded-xl shadow-lg w-full max-w-lg mx-4 max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <h2 className="text-lg font-semibold">分享技能</h2>
            <p className="text-sm text-muted-foreground">
              {skill.title}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-md transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Visibility Info */}
          {skill.visibility === "public" ? (
            <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-3 flex items-start gap-3">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-600 dark:text-blue-400 mt-0.5">
                <circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>
              </svg>
              <div className="text-sm">
                <p className="font-medium text-blue-900 dark:text-blue-100">公开技能</p>
                <p className="text-blue-700 dark:text-blue-300">此技能已公开，所有人都可以查看。分享功能仅用于协作管理。</p>
              </div>
            </div>
          ) : (
            <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg p-3 flex items-start gap-3">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-amber-600 dark:text-amber-400 mt-0.5">
                <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
              <div className="text-sm">
                <p className="font-medium text-amber-900 dark:text-amber-100">私有技能</p>
                <p className="text-amber-700 dark:text-amber-300">此技能为私有，只有你和被分享者可以查看。</p>
              </div>
            </div>
          )}

          {/* Search */}
          <div className="space-y-2">
            <label className="text-sm font-medium">搜索用户</label>
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="输入用户姓名搜索..."
                className="w-full h-10 pl-10 pr-4 rounded-md border bg-background text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              />
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
              </svg>
              {isSearching && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <div className="animate-spin w-4 h-4 border-2 border-primary border-t-transparent rounded-full"></div>
                </div>
              )}
            </div>
          </div>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="border rounded-lg divide-y">
              {searchResults.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-3 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full overflow-hidden bg-muted">
                      <img src={user.avatar_url} alt={user.name} className="w-full h-full object-cover" />
                    </div>
                    <span className="text-sm font-medium">{user.name}</span>
                  </div>
                  <button
                    onClick={() => handleShare(user)}
                    disabled={isSharing === user.id}
                    className="px-3 py-1.5 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50"
                  >
                    {isSharing === user.id ? "分享中..." : "分享"}
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Shared Users List */}
          {sharedUsers.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium">已分享用户</h3>
              <div className="border rounded-lg divide-y">
                {sharedUsers.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full overflow-hidden bg-muted">
                        <img src={user.avatar_url} alt={user.name} className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <span className="text-sm font-medium">{user.name}</span>
                        <p className="text-xs text-muted-foreground">
                          {new Date(user.sharedAt).toLocaleDateString("zh-CN")} 分享
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveShare(user.id)}
                      className="px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-950 rounded-md transition-colors"
                    >
                      取消分享
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {sharedUsers.length === 0 && skill.visibility === "private" && (
            <div className="text-center py-8 text-muted-foreground">
              <p className="text-sm">尚未分享给任何用户</p>
              <p className="text-xs mt-1">搜索用户姓名并开始分享</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
