import { getSession } from "@/lib/auth/session";
import { LoginButton } from "@/components/auth/login-button";
import { UploadForm } from "@/components/skills/upload-form";
import type { User } from "@/lib/auth/types";

function getDisplayName(user: User): string {
  if ("login" in user) {
    return user.name ?? user.login;
  }
  return user.name;
}

export default async function UploadPage() {
  const session = await getSession();

  if (!session) {
    return (
      <div className="max-w-2xl mx-auto py-12 md:py-24 text-center">
        <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm border">
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
        </div>
        <h1 className="font-display text-3xl md:text-4xl font-bold mb-4">登录后即可分享你的 skill</h1>
        <p className="text-lg text-muted-foreground mb-8 text-balance max-w-lg mx-auto">
          加入开发者社区，分享你最好的 patterns、架构指南和可复用组件。
        </p>
        <div className="flex justify-center">
          <LoginButton />
        </div>
      </div>
    );
  }

  const displayName = getDisplayName(session.user);

  return (
    <div className="max-w-2xl mx-auto py-8">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold mb-2">上传 Skill</h1>
        <p className="text-muted-foreground">
          欢迎，<span className="font-medium text-foreground">{displayName}</span>！把你的知识分享给开发者社区。
        </p>
      </div>

      <UploadForm />
    </div>
  );
}
