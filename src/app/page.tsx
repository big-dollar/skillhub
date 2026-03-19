import { getSkills } from "@/lib/mock-data";
import { SkillCard } from "@/components/skills/skill-card";

interface SearchParams {
  q?: string;
  sort?: "likes" | "newest" | "downloads";
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const resolvedParams = await searchParams;
  const q = resolvedParams?.q || "";
  const sort = resolvedParams?.sort || "likes";
  const skills = await getSkills(q, sort);

  return <HomePageView q={q} sort={sort} skills={skills} />;
}

function HomePageView({
  q,
  sort,
  skills,
}: {
  q: string;
  sort: "likes" | "newest" | "downloads";
  skills: Awaited<ReturnType<typeof getSkills>>;
}) {
  return (
    <div className="flex flex-col gap-8 md:gap-12">
      <section className="text-center space-y-4 max-w-3xl mx-auto pt-8 pb-4">
        <h1 className="font-display text-4xl md:text-6xl font-extrabold tracking-tight text-balance">
          为你的下一个项目找到合适的 <span className="text-primary bg-primary/10 px-2 py-1 rounded-md">skill</span>
        </h1>
        <p className="text-muted-foreground text-lg md:text-xl text-balance">
          一个精选的开发者知识库，收录优质 patterns、架构指南与可复用组件。
        </p>
      </section>

      <div className="sticky top-16 z-40 bg-background/80 backdrop-blur-md py-4 border-b flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center -mx-4 px-4 sm:mx-0 sm:px-0 rounded-none sm:rounded-lg">
        {/* Search Input Shell */}
        <form className="relative w-full sm:max-w-md flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3 text-muted-foreground"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
          <input 
            type="search"
            name="q"
            defaultValue={q}
            placeholder="搜索 patterns、skill 或标签..."
            className="w-full h-11 pl-10 pr-4 rounded-md border bg-background text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-primary transition-all placeholder:text-muted-foreground"
          />
          {/* Preserve sort state */}
          <input type="hidden" name="sort" value={sort} />
        </form>

        {/* Sort Controls Shell */}
        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0 hide-scrollbar">
          <span className="text-sm font-medium text-muted-foreground shrink-0 hidden md:inline-block">排序方式：</span>
          
          <form className="flex gap-2 shrink-0">
             <input type="hidden" name="q" value={q} />
               <button 
                name="sort" 
                value="likes"
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors border ${sort === 'likes' ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted/50 hover:bg-muted text-foreground'}`}
              >
                点赞最多
              </button>
             <button 
               name="sort" 
               value="newest"
               className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors border ${sort === 'newest' ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted/50 hover:bg-muted text-foreground'}`}
             >
                最新
             </button>
             <button 
               name="sort" 
               value="downloads"
               className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors border ${sort === 'downloads' ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted/50 hover:bg-muted text-foreground'}`}
             >
                下载最多
             </button>
          </form>
        </div>
      </div>

      <SkillsGrid query={q} skills={skills} />
    </div>
  );
}

function SkillsGrid({ query, skills }: { query: string; skills: Awaited<ReturnType<typeof getSkills>> }) {
  if (skills.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center border rounded-xl border-dashed bg-muted/20">
        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
        </div>
        <h3 className="text-xl font-display font-semibold mb-2">未找到匹配的 skill</h3>
        <p className="text-muted-foreground max-w-sm text-balance">
          没有找到和 “{query}” 匹配的内容。请检查拼写，或尝试其他关键词。
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {skills.map((skill) => (
        <SkillCard key={skill.id} skill={skill} />
      ))}
    </div>
  );
}
