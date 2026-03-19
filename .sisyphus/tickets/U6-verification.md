# U6: Verification / Hardening

## Goal
Prove the MVP works end-to-end locally. Integration tests, demo data, smoke checklist.

## Deliverables

### 1. Integration Test Suite

Create `tests/integration/flows.test.ts`:

```typescript
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { createTempDir, cleanupTempDir } from '../fixtures/temp-dir';
import { SkillRepository } from '@/lib/skills/repository';
import { SkillService } from '@/lib/skills/service';

describe('End-to-End Flows', () => {
  let tempDir: string;
  let repo: SkillRepository;
  let service: SkillService;

  beforeEach(async () => {
    tempDir = await createTempDir();
    repo = new SkillRepository(tempDir);
    service = new SkillService(repo);
  });

  afterAll(async () => {
    await cleanupTempDir(tempDir);
  });

  describe('Browse Flow', () => {
    it('should seed, search, sort, and open detail', async () => {
      // Arrange: Create multiple skills
      // Act: Search, sort, get by slug
      // Assert: All operations work correctly
    });

    it('should handle empty search results', async () => {
      // Test: Search with no matches returns empty
    });

    it('should sort consistently', async () => {
      // Test: Sort by likes then downloads gives expected order
    });
  });

  describe('Like Flow', () => {
    it('should increment likes and persist', async () => {
      // Test: Like → count increases → reload → count persists
    });

    it('should handle multiple likes', async () => {
      // Test: Rapid likes increment correctly
    });
  });

  describe('Download Flow', () => {
    it('should increment download count', async () => {
      // Test: Download → count increases
    });

    it('should serve file content', async () => {
      // Test: Download returns correct file
    });
  });
});
```

### 2. Demo Data Seeder
Create `tests/fixtures/seed-data.ts`:

```typescript
import type { CreateSkillInput } from '@/lib/skills/types';

export const demoSkills: CreateSkillInput[] = [
  {
    title: 'React Hooks Mastery',
    summary: 'Master useState, useEffect, useContext, and custom hooks',
    uploaderName: 'Demo Uploader',
    archivePath: './data/uploads/react-hooks.zip',
    skillMdPath: './data/extracted/react-hooks.md',
    readmeStubPath: './data/generated/react-hooks-readme.md',
  },
  {
    title: 'TypeScript Fundamentals',
    summary: 'Learn TypeScript from basics to advanced patterns',
    uploaderName: 'Demo Uploader',
    archivePath: './data/uploads/typescript.zip',
    skillMdPath: './data/extracted/typescript.md',
    readmeStubPath: './data/generated/typescript-readme.md',
  },
  {
    title: 'Next.js App Router',
    summary: 'Build modern apps with Next.js App Router and Server Components',
    uploaderName: 'Demo Uploader',
    archivePath: './data/uploads/nextjs.zip',
    skillMdPath: './data/extracted/nextjs.md',
    readmeStubPath: './data/generated/nextjs-readme.md',
  },
  {
    title: 'Tailwind CSS Patterns',
    summary: 'Reusable Tailwind patterns for common UI components',
    uploaderName: 'Demo Uploader',
    archivePath: './data/uploads/tailwind.zip',
    skillMdPath: './data/extracted/tailwind.md',
    readmeStubPath: './data/generated/tailwind-readme.md',
  },
  {
    title: 'Node.js API Design',
    summary: 'RESTful API design patterns with Node.js and Express',
    uploaderName: 'Demo Uploader',
    archivePath: './data/uploads/nodejs.zip',
    skillMdPath: './data/extracted/nodejs.md',
    readmeStubPath: './data/generated/nodejs-readme.md',
  },
];

export async function seedDemoData(service: SkillService) {
  for (const skill of demoSkills) {
    await service.createSkill(skill);
  }
}

export async function seedWithLikesAndDownloads(
  service: SkillService,
  repo: SkillRepository
) {
  // Add varying like/download counts for testing sort
  const skills = await repo.list();
  
  for (let i = 0; i < skills.length; i++) {
    const skill = skills[i];
    // Add i*10 likes and i*5 downloads
    for (let l = 0; l < i * 10; l++) {
      await service.likeSkill(skill.id);
    }
    for (let d = 0; d < i * 5; d++) {
      await service.recordDownload(skill.id);
    }
  }
}
```

### 3. Test Fixtures
Create sample files for testing:

**Sample SKILL.md** (`tests/fixtures/sample-skill.md`):
```markdown
# React Hooks Mastery

Learn to build powerful React applications using modern hooks patterns.

## Prerequisites

- Basic JavaScript knowledge
- React fundamentals

## Contents

1. useState deep dive
2. useEffect patterns
3. Custom hooks
4. Performance optimization

## Getting Started

Follow along with the examples in the /examples directory.
```

**Sample ZIP creation** (`tests/fixtures/create-sample-zip.ts`):
```typescript
import AdmZip from 'adm-zip';
import fs from 'fs/promises';
import path from 'path';

export async function createSampleZip(skillMdContent: string, outputPath: string) {
  const zip = new AdmZip();
  zip.addFile('SKILL.md', Buffer.from(skillMdContent, 'utf-8'));
  zip.addFile('README.md', Buffer.from('# Sample Project', 'utf-8'));
  zip.addFile('examples/example.js', Buffer.from('console.log("Hello");', 'utf-8'));
  
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await zip.writeZip(outputPath);
}
```

### 4. Smoke Checklist
Create `docs/smoke-checklist.md`:

```markdown
# SkillHub MVP Smoke Checklist

## Pre-flight
- [ ] `pnpm install` completes
- [ ] `pnpm test` passes
- [ ] `pnpm lint` passes
- [ ] `pnpm build` succeeds
- [ ] `pnpm dev` starts without errors

## Homepage
- [ ] Loads with skills displayed
- [ ] Grid layout correct (1 col mobile, 2 col tablet, 3 col desktop)
- [ ] Skill cards show title, summary, likes, downloads, uploader
- [ ] Cards link to detail pages

## Search
- [ ] Search filters skills in real-time
- [ ] Empty search shows all skills
- [ ] No matches shows empty state
- [ ] Search is case-insensitive
- [ ] Search matches title and summary

## Sort
- [ ] "Most Liked" sorts by likes descending
- [ ] "Most Downloaded" sorts by downloads descending
- [ ] Sort persists across page refresh (via URL)
- [ ] Sort works with search query

## Detail Page
- [ ] Shows correct skill data
- [ ] Displays title, summary, stats
- [ ] Shows uploader name
- [ ] Like button visible
- [ ] Download button visible
- [ ] Back link works
- [ ] 404 for invalid slug

## Like
- [ ] Like button increments count
- [ ] Count updates without page refresh
- [ ] Persists after page refresh
- [ ] Works from detail page

## Download
- [ ] Download triggers file download
- [ ] Download count increments
- [ ] Count persists after download
- [ ] Returns 404 for missing skill
- [ ] Returns 404 for missing file

## Auth
- [ ] Header shows "Sign In" when anonymous
- [ ] Clicking Sign In sets session
- [ ] Header shows uploader name when logged in
- [ ] Sign Out clears session
- [ ] Session persists across page navigations

## Upload Gate
- [ ] Anonymous user sees sign-in CTA on /upload
- [ ] Logged-in user sees upload form
- [ ] Direct API call without session returns 401

## Upload Flow
- [ ] Form validates required fields
- [ ] File input accepts .zip only
- [ ] Valid upload creates skill
- [ ] Missing SKILL.md shows error
- [ ] Success redirects to detail page
- [ ] New skill appears in browse immediately

## Responsive
- [ ] Mobile (320px): usable layout
- [ ] Tablet (768px): 2-column grid
- [ ] Desktop (1440px): 3-column grid
- [ ] No horizontal scroll
- [ ] Touch targets adequate size

## Dark Mode
- [ ] Respects system preference
- [ ] All elements visible in dark mode
- [ ] No contrast issues

## Performance
- [ ] Homepage loads < 2s
- [ ] Detail page loads < 1s
- [ ] No console errors
- [ ] No memory leaks (check after navigation)

## Edge Cases
- [ ] Empty database shows appropriate message
- [ ] Very long titles truncate gracefully
- [ ] Very long summaries truncate gracefully
- [ ] Special characters in titles handled
- [ ] Unicode content displays correctly
```

### 5. Manual Test Script
Create `scripts/manual-test.ts`:

```typescript
#!/usr/bin/env tsx
/**
 * Manual test script for SkillHub MVP
 * Run with: pnpm tsx scripts/manual-test.ts
 */

import { SkillRepository } from '@/lib/skills/repository';
import { SkillService } from '@/lib/skills/service';
import { demoSkills, seedWithLikesAndDownloads } from '@/tests/fixtures/seed-data';

async function runManualTest() {
  console.log('🧪 SkillHub Manual Test\n');
  
  const repo = new SkillRepository('./data');
  const service = new SkillService(repo);
  
  // Test 1: Seed data
  console.log('1. Seeding demo data...');
  for (const skill of demoSkills) {
    await service.createSkill(skill);
  }
  console.log('   ✓ Seeded', demoSkills.length, 'skills\n');
  
  // Test 2: List skills
  console.log('2. Listing all skills...');
  const allSkills = await service.searchSkills();
  console.log('   ✓ Found', allSkills.length, 'skills');
  allSkills.forEach(s => console.log(`   - ${s.title} (${s.likes} likes, ${s.downloads} downloads)`));
  console.log();
  
  // Test 3: Search
  console.log('3. Testing search...');
  const searchResults = await service.searchSkills('react');
  console.log('   ✓ Search "react":', searchResults.length, 'results');
  console.log();
  
  // Test 4: Sort
  console.log('4. Testing sort...');
  const byDownloads = await service.searchSkills(undefined, 'downloads');
  console.log('   ✓ Sorted by downloads:', byDownloads[0]?.title);
  console.log();
  
  // Test 5: Get by slug
  console.log('5. Testing get by slug...');
  const skill = await service.getSkillBySlug('react-hooks-mastery');
  console.log('   ✓ Found:', skill?.title);
  console.log();
  
  // Test 6: Like
  console.log('6. Testing like...');
  if (skill) {
    const before = skill.likes;
    await service.likeSkill(skill.id);
    const after = (await service.getSkillBySlug('react-hooks-mastery'))?.likes;
    console.log(`   ✓ Likes: ${before} → ${after}`);
  }
  console.log();
  
  // Test 7: Download
  console.log('7. Testing download count...');
  if (skill) {
    const before = skill.downloads;
    await service.recordDownload(skill.id);
    const after = (await service.getSkillBySlug('react-hooks-mastery'))?.downloads;
    console.log(`   ✓ Downloads: ${before} → ${after}`);
  }
  console.log();
  
  console.log('✅ All manual tests passed!');
}

runManualTest().catch(console.error);
```

### 6. Edge Case Tests
Create `tests/integration/edge-cases.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';

describe('Edge Cases', () => {
  it('should handle empty database', async () => {
    // Test: No skills → empty list, no errors
  });

  it('should handle very long titles', async () => {
    // Test: 500 char title handled gracefully
  });

  it('should handle special characters in titles', async () => {
    // Test: Emojis, symbols, etc.
  });

  it('should handle unicode content', async () => {
    // Test: Chinese, Arabic, etc.
  });

  it('should handle rapid concurrent operations', async () => {
    // Test: 10 simultaneous likes
  });

  it('should handle malformed zip files', async () => {
    // Test: Corrupted zip returns error
  });

  it('should handle missing files gracefully', async () => {
    // Test: File deleted but record exists
  });
});
```

### 7. Performance Benchmarks
Create `tests/performance/benchmarks.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';

describe('Performance', () => {
  it('should list 100 skills in < 100ms', async () => {
    // Test: Performance benchmark
  });

  it('should search 100 skills in < 50ms', async () => {
    // Test: Search performance
  });

  it('should handle 1000 likes without degradation', async () => {
    // Test: Stress test
  });
});
```

## Acceptance Criteria

- [ ] All integration tests pass
- [ ] All edge case tests pass
- [ ] Manual test script runs successfully
- [ ] Smoke checklist completed manually
- [ ] Demo data loads and displays correctly
- [ ] No console errors in browser
- [ ] No TypeScript errors
- [ ] All lint checks pass
- [ ] `pnpm build` succeeds
- [ ] Mobile layout verified
- [ ] Desktop layout verified
- [ ] Dark mode verified
- [ ] Upload → Browse → Download flow works end-to-end
- [ ] Performance acceptable (< 2s page loads)

## Files to Create

```
tests/
├── integration/
│   ├── flows.test.ts
│   └── edge-cases.test.ts
├── performance/
│   └── benchmarks.test.ts
├── fixtures/
│   ├── seed-data.ts
│   ├── sample-skill.md
│   └── create-sample-zip.ts
└── setup.ts              (extend with demo data)

docs/
└── smoke-checklist.md

scripts/
└── manual-test.ts
```

## Dependencies

- U2: UI Shell / Browse Experience
- U4: Like + Download APIs
- U5: Upload Ingestion

## Parallelization

Final phase - sequential after all other units.

## Estimated Effort

3-4 hours

## Notes

- Integration tests use temp directories (isolated)
- Manual smoke checklist must be completed by human
- Demo data should be realistic and varied
- Edge cases: empty, long, special chars, unicode, concurrent
- Performance tests are benchmarks, not strict requirements
- Consider adding screenshot/visual regression tests (future)
- Document any known limitations or TODOs
- Create troubleshooting guide for common issues
