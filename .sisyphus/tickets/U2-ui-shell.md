# U2: UI Shell / Browse Experience

## Goal
Replace starter UI with polished, lightweight browsing experience. Build homepage and detail pages with search, sort, and beautiful responsive design.

## Deliverables

### 1. Design System Extensions
Extend `src/app/globals.css`:

```css
@import "tailwindcss";

:root {
  --background: #fafaf9;        /* Warm neutral - stone-50 */
  --foreground: #1c1917;        /* Stone-900 */
  --card: #ffffff;
  --card-foreground: #1c1917;
  --primary: #0c0a09;           /* Stone-950 */
  --primary-foreground: #fafaf9;
  --secondary: #f5f5f4;         /* Stone-100 */
  --secondary-foreground: #44403c;
  --muted: #f5f5f4;
  --muted-foreground: #78716c;
  --accent: #e7e5e4;            /* Stone-200 */
  --accent-foreground: #292524;
  --border: #e7e5e4;
  --ring: #a8a29e;
  --radius: 0.625rem;
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-border: var(--border);
  --color-ring: var(--ring);
  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);
  --font-sans: var(--font-geist-sans);
  --font-mono: var(--font-geist-mono);
}
```

### 2. UI Components

Create `src/components/ui/`:

**Button** (`button.tsx`):
```typescript
import { cn } from '@/lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

export function Button({ className, variant = 'primary', size = 'md', ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center rounded-lg font-medium transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        'disabled:pointer-events-none disabled:opacity-50',
        {
          'bg-primary text-primary-foreground hover:bg-primary/90': variant === 'primary',
          'bg-secondary text-secondary-foreground hover:bg-secondary/80': variant === 'secondary',
          'hover:bg-accent hover:text-accent-foreground': variant === 'ghost',
          'h-8 px-3 text-sm': size === 'sm',
          'h-10 px-4': size === 'md',
          'h-12 px-6': size === 'lg',
        },
        className
      )}
      {...props}
    />
  );
}
```

**Card** (`card.tsx`):
```typescript
import { cn } from '@/lib/utils';

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'rounded-xl border bg-card text-card-foreground shadow-sm',
        className
      )}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex flex-col space-y-1.5 p-6', className)} {...props} />;
}

export function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn('font-semibold leading-none tracking-tight', className)} {...props} />;
}

export function CardDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn('text-sm text-muted-foreground', className)} {...props} />;
}

export function CardContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('p-6 pt-0', className)} {...props} />;
}
```

**Input** (`input.tsx`):
```typescript
import { cn } from '@/lib/utils';

export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        'flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2',
        'text-sm ring-offset-background placeholder:text-muted-foreground',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
      {...props}
    />
  );
}
```

**Badge** (`badge.tsx`):
```typescript
import { cn } from '@/lib/utils';

export function Badge({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold',
        'transition-colors focus:outline-none focus:ring-2 focus:ring-ring',
        className
      )}
      {...props}
    />
  );
}
```

### 3. Utility Function
Create `src/lib/utils.ts`:
```typescript
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

### 4. Skill Components

Create `src/components/skills/`:

**SkillCard** (`skill-card.tsx`):
```typescript
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Heart, Download } from 'lucide-react'; // Use any icon library
import type { SkillRecord } from '@/lib/skills/types';

interface SkillCardProps {
  skill: SkillRecord;
}

export function SkillCard({ skill }: SkillCardProps) {
  return (
    <Link href={`/skills/${skill.slug}`}>
      <Card className="hover:border-primary/50 transition-colors cursor-pointer">
        <CardHeader>
          <CardTitle className="text-lg">{skill.title}</CardTitle>
          <CardDescription className="line-clamp-2">{skill.summary}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Heart className="w-4 h-4" />
              <span>{skill.likes}</span>
            </div>
            <div className="flex items-center gap-1">
              <Download className="w-4 h-4" />
              <span>{skill.downloads}</span>
            </div>
            <Badge variant="secondary">{skill.uploaderName}</Badge>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
```

**SkillGrid** (`skill-grid.tsx`):
```typescript
import { SkillCard } from './skill-card';
import type { SkillRecord } from '@/lib/skills/types';

interface SkillGridProps {
  skills: SkillRecord[];
}

export function SkillGrid({ skills }: SkillGridProps) {
  if (skills.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">No skills found</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {skills.map((skill) => (
        <SkillCard key={skill.id} skill={skill} />
      ))}
    </div>
  );
}
```

**SearchInput** (`search-input.tsx`):
```typescript
'use client';

import { useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

export function SearchInput() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('q') || '');

  const handleSearch = useCallback(
    (value: string) => {
      const params = new URLSearchParams(searchParams);
      if (value) {
        params.set('q', value);
      } else {
        params.delete('q');
      }
      router.push(`/?${params.toString()}`);
    },
    [router, searchParams]
  );

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
      <Input
        type="search"
        placeholder="Search skills..."
        className="pl-10"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          handleSearch(e.target.value);
        }}
      />
    </div>
  );
}
```

**SortTabs** (`sort-tabs.tsx`):
```typescript
'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';
import type { SortField } from '@/lib/skills/types';

const sortOptions: { value: SortField; label: string }[] = [
  { value: 'likes', label: 'Most Liked' },
  { value: 'downloads', label: 'Most Downloaded' },
];

export function SortTabs() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentSort = (searchParams.get('sort') as SortField) || 'likes';

  const handleSort = (sort: SortField) => {
    const params = new URLSearchParams(searchParams);
    params.set('sort', sort);
    router.push(`/?${params.toString()}`);
  };

  return (
    <div className="flex gap-2">
      {sortOptions.map((option) => (
        <button
          key={option.value}
          onClick={() => handleSort(option.value)}
          className={cn(
            'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
            currentSort === option.value
              ? 'bg-primary text-primary-foreground'
              : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
```

### 5. Homepage
Replace `src/app/page.tsx`:

```typescript
import { Suspense } from 'react';
import { SkillGrid } from '@/components/skills/skill-grid';
import { SearchInput } from '@/components/skills/search-input';
import { SortTabs } from '@/components/skills/sort-tabs';
import { SkillService } from '@/lib/skills/service';
import { SkillRepository } from '@/lib/skills/repository';
import type { SortField } from '@/lib/skills/types';

interface HomePageProps {
  searchParams: { q?: string; sort?: SortField };
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const repo = new SkillRepository(process.env.DATA_DIR || './data');
  const service = new SkillService(repo);
  
  const skills = await service.searchSkills(
    searchParams.q,
    searchParams.sort as SortField
  );

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight mb-2">SkillHub</h1>
          <p className="text-muted-foreground">Discover and share skills</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="flex-1">
            <SearchInput />
          </div>
          <SortTabs />
        </div>

        <Suspense fallback={<div>Loading...</div>}>
          <SkillGrid skills={skills} />
        </Suspense>
      </main>
    </div>
  );
}
```

### 6. Detail Page
Create `src/app/skills/[slug]/page.tsx`:

```typescript
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { SkillService } from '@/lib/skills/service';
import { SkillRepository } from '@/lib/skills/repository';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Heart, Download, ArrowLeft } from 'lucide-react';

interface SkillPageProps {
  params: { slug: string };
}

export default async function SkillPage({ params }: SkillPageProps) {
  const repo = new SkillRepository(process.env.DATA_DIR || './data');
  const service = new SkillService(repo);
  
  const skill = await service.getSkillBySlug(params.slug);
  
  if (!skill) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <Link href="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="w-4 h-4" />
          Back to skills
        </Link>

        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-2">{skill.title}</h1>
            <p className="text-muted-foreground">{skill.summary}</p>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Heart className="w-5 h-5" />
              <span className="font-medium">{skill.likes}</span>
              <span>likes</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Download className="w-5 h-5" />
              <span className="font-medium">{skill.downloads}</span>
              <span>downloads</span>
            </div>
            <Badge variant="secondary">{skill.uploaderName}</Badge>
          </div>

          <div className="flex gap-3">
            <form action={`/api/skills/${skill.id}/like`} method="POST">
              <Button type="submit" variant="secondary">
                <Heart className="w-4 h-4 mr-2" />
                Like
              </Button>
            </form>
            <a href={`/api/skills/${skill.id}/download`} download>
              <Button>
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
            </a>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>README Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm max-w-none">
                {/* Render README stub content here */}
                <p className="text-muted-foreground italic">
                  README stub content will be loaded here...
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
```

### 7. Header Component
Create `src/components/layout/header.tsx`:

```typescript
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export function Header() {
  return (
    <header className="border-b bg-card">
      <div className="container mx-auto px-4 h-14 flex items-center justify-between max-w-6xl">
        <Link href="/" className="font-bold text-lg">
          SkillHub
        </Link>
        <nav className="flex items-center gap-4">
          <Link href="/upload">
            <Button variant="ghost" size="sm">Upload</Button>
          </Link>
          {/* Session state will be added in U3 */}
        </nav>
      </div>
    </header>
  );
}
```

Update `src/app/layout.tsx` to include Header:
```typescript
import { Header } from '@/components/layout/header';
// ... existing imports

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <Header />
        {children}
      </body>
    </html>
  );
}
```

## Test-First Requirements

Write these tests BEFORE implementation:

```typescript
// tests/unit/homepage.test.tsx
describe('HomePage', () => {
  it('should render seeded skills', async () => {
    // Arrange: Seed repository with skills
    // Act: Render homepage
    // Assert: Skills displayed in grid
  });

  it('should filter skills by search query', async () => {
    // Test: Search input filters displayed skills
  });

  it('should sort skills by likes', async () => {
    // Test: Sort tabs change ordering
  });

  it('should sort skills by downloads', async () => {
    // Test: Sort tabs change ordering
  });

  it('should show empty state when no skills', async () => {
    // Test: Empty repository shows "No skills found"
  });

  it('should link to detail pages', async () => {
    // Test: Skill cards link to /skills/{slug}
  });
});

// tests/unit/skill-detail.test.tsx
describe('SkillPage', () => {
  it('should render skill details', async () => {
    // Test: Title, summary, stats displayed
  });

  it('should show 404 for missing skill', async () => {
    // Test: Invalid slug shows not-found
  });

  it('should have like button', async () => {
    // Test: Like form posts to API
  });

  it('should have download link', async () => {
    // Test: Download link points to API
  });
});
```

## Dependencies to Add

```bash
pnpm add clsx tailwind-merge lucide-react
```

## Acceptance Criteria

- [ ] Homepage displays skills in responsive grid (1/2/3 columns)
- [ ] Search filters skills in real-time (debounced)
- [ ] Sort toggle switches between likes/downloads
- [ ] Detail page shows all skill metadata
- [ ] Like button posts to API endpoint
- [ ] Download button links to API endpoint
- [ ] Responsive: works on mobile (320px) and desktop (1440px)
- [ ] Dark mode support via CSS variables
- [ ] Empty state shown when no skills match
- [ ] Loading state during data fetch
- [ ] Navigation between home and detail works
- [ ] All tests pass
- [ ] No visual regressions from starter template

## Files to Create

```
src/
├── components/
│   ├── ui/
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── input.tsx
│   │   └── badge.tsx
│   ├── skills/
│   │   ├── skill-card.tsx
│   │   ├── skill-grid.tsx
│   │   ├── search-input.tsx
│   │   └── sort-tabs.tsx
│   └── layout/
│       └── header.tsx
├── lib/
│   └── utils.ts
├── app/
│   ├── page.tsx          (replace)
│   ├── layout.tsx        (modify)
│   ├── globals.css       (extend)
│   └── skills/
│       └── [slug]/
│           └── page.tsx
```

## Dependencies

- U0: Foundation + TDD Harness (test setup)
- Can mock service layer initially, finalize after U1

## Parallelization

Parallel with U1 (Data Layer) and U3 (Mock Auth) after U0.

## Estimated Effort

6-8 hours

## Notes

- Use Tailwind v4 CSS-first configuration (no tailwind.config.js)
- Keep components in separate files for reusability
- Use `cn()` utility for conditional classes
- Search should be URL-driven for shareable links
- Consider adding loading skeletons for better UX
- README preview can be simple for MVP - full rendering later
