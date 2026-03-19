import Link from "next/link";
import { getSession } from "@/lib/auth/session";
import { LoginButton } from "@/components/auth/login-button";
import { LogoutButton } from "@/components/auth/logout-button";
import type { User } from "@/lib/auth/types";

function getDisplayName(user: User): string {
  if ("login" in user) {
    return user.name ?? user.login;
  }
  return user.name;
}

export async function AuthStatus() {
  const session = await getSession();

  if (!session) {
    return <LoginButton />;
  }

  const displayName = getDisplayName(session.user);

  return (
    <div className="flex items-center gap-3">
      <Link
        href="/profile"
        className="flex items-center gap-2 hover:opacity-80 transition-opacity"
        title="查看我的技能"
      >
        <img
          src={session.user.avatar_url}
          alt={displayName}
          className="w-8 h-8 rounded-full border"
        />
        <span className="text-sm font-medium text-foreground">{displayName}</span>
      </Link>
      <LogoutButton />
    </div>
  );
}
