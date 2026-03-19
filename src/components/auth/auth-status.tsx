import { getSession } from "@/lib/auth/session";
import { LoginButton } from "@/components/auth/login-button";
import { LogoutButton } from "@/components/auth/logout-button";

export async function AuthStatus() {
  const session = await getSession();

  if (!session) {
    return <LoginButton />;
  }

  const displayName = session.user.name ?? session.user.login;

  return (
    <div className="flex items-center gap-3">
      <img
        src={session.user.avatar_url}
        alt={displayName}
        className="w-8 h-8 rounded-full border"
      />
      <span className="text-sm font-medium text-foreground">{displayName}</span>
      <LogoutButton />
    </div>
  );
}
