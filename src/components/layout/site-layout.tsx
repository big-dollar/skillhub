import { Header } from "./header";

export function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      {/* Background patterns */}
      <div className="absolute inset-0 z-[-1] grid-pattern opacity-50 pointer-events-none" />
      <div className="absolute top-0 right-[-20%] w-[50%] h-[50%] z-[-2] bg-primary/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-20%] left-[-10%] w-[40%] h-[40%] z-[-2] bg-blue-500/10 blur-[120px] rounded-full pointer-events-none" />
      
      <Header />
      <main className="flex-1 w-full mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 md:py-12 relative z-10">
        {children}
      </main>
      <footer className="border-t py-6 md:py-10 mt-auto bg-muted/30">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} SkillHub MVP。为开发者而建。</p>
        </div>
      </footer>
    </div>
  );
}
