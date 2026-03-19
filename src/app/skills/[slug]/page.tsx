import { notFound } from "next/navigation";
import Link from "next/link";
import { getSkillBySlug } from "@/lib/mock-data";
import { LikeButton } from "@/components/skills/like-button";

export default async function SkillDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const resolvedParams = await params;
  const skill = await getSkillBySlug(resolvedParams.slug);

  if (!skill) {
    notFound();
  }

      const formattedDate = new Date(skill.updatedAt).toLocaleDateString('zh-CN', {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      });

  return (
    <div className="max-w-4xl mx-auto">
      <Link href="/" className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors mb-8">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        返回浏览
      </Link>

      <div className="bg-card border rounded-2xl p-6 md:p-10 shadow-sm relative overflow-hidden mb-8">
        {/* Decorative background */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-bl-full pointer-events-none" />
        
        <div className="relative z-10">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-8">
            <div>
              <h1 className="font-display text-3xl md:text-5xl font-bold mb-4 text-balance">{skill.title}</h1>
              <p className="text-lg text-muted-foreground max-w-2xl">{skill.description}</p>
            </div>
            
            <div className="flex items-center gap-3 shrink-0">
               <LikeButton initialLikes={skill.likes} skillId={skill.id} />
                <a
                  className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
                  href={`/api/skills/${skill.id}/download`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
                  下载（{skill.downloads}）
                </a>
             </div>
          </div>

          <div className="flex flex-wrap items-center gap-y-4 gap-x-8 pt-6 border-t text-sm">
             <div className="flex items-center gap-3">
               <div className="w-10 h-10 rounded-full overflow-hidden bg-muted border relative">
                 {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={skill.author.avatarUrl || ''} alt={skill.author.name} className="w-full h-full object-cover" />
               </div>
               <div>
                 <p className="font-medium text-foreground">作者</p>
                <p className="text-muted-foreground">{skill.author.name}</p>
              </div>
            </div>

            <div className="h-10 w-px bg-border hidden md:block" />

            <div>
                <p className="font-medium text-foreground">版本</p>
               <p className="text-muted-foreground">{skill.version}</p>
            </div>

            <div className="h-10 w-px bg-border hidden md:block" />

            <div>
                <p className="font-medium text-foreground">最后更新</p>
               <p className="text-muted-foreground">{formattedDate}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-8">
             <div className="prose prose-zinc dark:prose-invert max-w-none">
                <h2 className="font-display text-2xl font-semibold mb-4">关于这个 skill</h2>
             {skill.readmeContent.split(/\r?\n\r?\n/).map((block, index) => (
               <p className="text-muted-foreground whitespace-pre-wrap" key={`${skill.id}-${index}`}>
                 {block}
               </p>
             ))}
             <div className="bg-muted p-4 rounded-lg my-6 font-mono text-sm border">
                <span className="text-primary">npm</span> install @skillhub/{skill.slug}
             </div>
           </div>
        </div>
        
        <div className="space-y-6">
          <div className="bg-card border rounded-xl p-6 shadow-sm">
             <h3 className="font-display font-semibold text-lg mb-4">标签</h3>
            <div className="flex flex-wrap gap-2">
              {skill.tags.map(tag => (
                <Link key={tag} href={`/?q=${tag}`} className="inline-flex items-center rounded-md bg-muted px-2.5 py-1.5 text-sm font-medium hover:bg-primary/10 hover:text-primary transition-colors ring-1 ring-inset ring-border">
                  {tag}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
