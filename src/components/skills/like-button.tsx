"use client";

import { useState } from "react";

export function LikeButton({ initialLikes, skillId }: { initialLikes: number; skillId: string }) {
  const [likes, setLikes] = useState(initialLikes);
  const [isLoading, setIsLoading] = useState(false);

  const handleLike = async () => {
    if (isLoading) {
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`/api/skills/${skillId}/like`, { method: "POST" });

      if (!response.ok) {
        return;
      }

      const payload = (await response.json()) as { likes: number };
      setLikes(payload.likes);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      className="flex items-center gap-2 rounded-md border bg-background px-4 py-2 font-medium transition-colors hover:bg-muted disabled:opacity-60"
      disabled={isLoading}
      onClick={handleLike}
      type="button"
    >
      <span aria-hidden="true">♥</span>
      {isLoading ? "..." : likes}
    </button>
  );
}
