import Link from 'next/link';
import { Skill } from '@/lib/mock-data';

export function SkillCard({ skill }: { skill: Skill }) {
  // Format dates: "Oct 15, 2023"
  const formattedDate = new Date(skill.updatedAt).toLocaleDateString('zh-CN', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  return (
    <Link 
      href={`/skills/${skill.slug}`}
      className="group block rounded-xl border bg-card text-card-foreground shadow-sm hover:shadow-md hover:border-primary/50 transition-all duration-300 relative overflow-hidden"
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-full pointer-events-none group-hover:bg-primary/10 transition-colors" />
      
      <div className="p-6 flex flex-col h-full">
         <div className="flex items-start justify-between mb-4">
           <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full overflow-hidden bg-muted flex-shrink-0 border">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={skill.author.avatarUrl} alt={skill.author.name} className="w-full h-full object-cover" />
             </div>
             <div className="flex flex-col">
              <span className="text-xs font-medium leading-tight">{skill.author.name}</span>
              <span className="text-[10px] text-muted-foreground">v{skill.version} • {formattedDate}</span>
            </div>
          </div>
        </div>

        <div className="mb-4 flex-grow">
          <h3 className="font-display font-semibold text-lg md:text-xl mb-2 group-hover:text-primary transition-colors text-balance">
            {skill.title}
          </h3>
          <p className="text-sm text-muted-foreground line-clamp-3">
            {skill.description}
          </p>
        </div>

        <div className="mt-auto pt-4 border-t flex items-center justify-between">
          <div className="flex flex-wrap gap-1">
            {skill.tags.slice(0, 2).map(tag => (
              <span key={tag} className="inline-flex items-center rounded-md bg-muted px-2 py-1 text-xs font-medium ring-1 ring-inset ring-border">
                {tag}
              </span>
            ))}
            {skill.tags.length > 2 && (
              <span className="inline-flex items-center rounded-md bg-muted px-2 py-1 text-xs font-medium text-muted-foreground ring-1 ring-inset ring-border">
                +{skill.tags.length - 2}
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-3 text-sm text-muted-foreground font-medium">
            <span className="flex items-center gap-1 group/like hover:text-red-500 transition-colors">
               <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="group-hover/like:fill-red-500/20"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
               {skill.likes}
            </span>
            <span className="flex items-center gap-1">
               <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
               {skill.downloads}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
