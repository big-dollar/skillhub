import Link from "next/link";
import { AuthStatus } from "@/components/auth/auth-status";

export async function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b glass">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="font-display font-bold text-xl tracking-tight flex items-center gap-2">
          <div className="w-8 h-8 rounded-md bg-primary text-primary-foreground flex items-center justify-center font-bold">
            S
          </div>
          SkillHub (技能中心)
        </Link>
        
        <nav className="flex items-center gap-6">
          <Link href="/" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            浏览
          </Link>
          <Link href="/upload" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            上传
          </Link>
          
          <div className="h-6 w-px bg-border mx-2" aria-hidden="true" />
          <AuthStatus />
        </nav>
      </div>
    </header>
  );
}
