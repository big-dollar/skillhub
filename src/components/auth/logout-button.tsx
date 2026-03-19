"use client";

import { useRouter } from "next/navigation";

export function LogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    await fetch("/api/auth/mock-logout", { method: "POST" });
    router.refresh();
  };

  return (
    <button
      onClick={handleLogout}
      className="rounded-md border border-border px-4 py-2 text-sm font-medium transition-colors hover:border-primary hover:text-primary"
      type="button"
    >
      退出登录
    </button>
  );
}
