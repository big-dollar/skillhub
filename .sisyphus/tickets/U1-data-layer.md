# U1: Data Layer / Local Persistence

## Goal
Create storage-agnostic repository backed by local JSON/files. All business logic lives in pure services with no Next.js dependencies.

## Deliverables

### 1. Repository Interface
Create `src/lib/skills/repository.ts`:

```typescript
import fs from 'fs/promises';
import path from 'path';
import type { SkillRecord, CreateSkillInput, SortField } from './types';

export interface ISkillRepository {
  list(opts?: { q?: string; sort?: SortField }): Promise<SkillRecord[]>;
  getBySlug(slug: string): Promise<SkillRecord | null>;
  getById(id: string): Promise<SkillRecord | null>;
  create(input: CreateSkillInput): Promise<SkillRecord>;
  incrementLikes(id: string): Promise<SkillRecord>;
  incrementDownloads(id: string): Promise<SkillRecord>;
}

export class SkillRepository implements ISkillRepository {
  private dbPath: string;
  private dataDir: string;

  constructor(dataDir: string) {
    this.dataDir = dataDir;
    this.dbPath = path.join(dataDir, 'skills.json');
  }

  private async ensureDb(): Promise<void> {
    try {
      await fs.access(this.dbPath);
    } catch {
      await fs.mkdir(this.dataDir, { recursive: true });
      await fs.writeFile(this.dbPath, JSON.stringify([], null, 2));
    }
  }

  private async readDb(): Promise<SkillRecord[]> {
    await this.ensureDb();
    const data = await fs.readFile(this.dbPath, 'utf-8');
    return JSON.parse(data);
  }

  private async writeDb(skills: SkillRecord[]): Promise<void> {
    await fs.writeFile(this.dbPath, JSON.stringify(skills, null, 2));
  }

  // Implement methods...
}
```

### 2. Service Layer
Create `src/lib/skills/service.ts`:

```typescript
import type { ISkillRepository } from './repository';
import type { SkillRecord, CreateSkillInput, SortField } from './types';

export class SkillService {
  constructor(private repository: ISkillRepository) {}

  async searchSkills(query?: string, sort: SortField = 'likes'): Promise<SkillRecord[]> {
    // Implementation
  }

  async getSkillBySlug(slug: string): Promise<SkillRecord | null> {
    // Implementation
  }

  async createSkill(input: CreateSkillInput): Promise<SkillRecord> {
    // Implementation with slug generation
  }

  async likeSkill(id: string): Promise<SkillRecord> {
    // Implementation
  }

  async recordDownload(id: string): Promise<SkillRecord> {
    // Implementation
  }
}

// Pure utility functions
export function generateSlug(title: string, existingSlugs: string[]): string {
  // Convert title to URL-safe slug
  // Handle duplicates by appending -2, -3, etc.
}

export function matchesSearch(skill: SkillRecord, query: string): boolean {
  // Check title, summary for query match
}
```

### 3. Test-First Requirements

Write these tests BEFORE implementation:

```typescript
// tests/unit/repository.test.ts
describe('SkillRepository', () => {
  it('should list all skills sorted by likes desc by default', async () => {
    // Arrange: Create skills with different like counts
    // Act: Call repo.list()
    // Assert: Skills ordered by likes descending
  });

  it('should sort skills by downloads when specified', async () => {
    // Test sort: 'downloads'
  });

  it('should filter skills by search query', async () => {
    // Test q: 'react' matches title/summary
  });

  it('should get skill by slug', async () => {
    // Test getBySlug returns correct skill or null
  });

  it('should create skill with generated slug', async () => {
    // Test create generates slug from title
  });

  it('should handle duplicate titles with incremental slugs', async () => {
    // Test "My Skill" → "my-skill", "my-skill-2", "my-skill-3"
  });

  it('should increment likes atomically', async () => {
    // Test incrementLikes increases count by 1
  });

  it('should increment downloads atomically', async () => {
    // Test incrementDownloads increases count by 1
  });

  it('should persist data between instances', async () => {
    // Test: Create repo1, add skill, create repo2 (same path), verify skill exists
  });
});

// tests/unit/service.test.ts
describe('SkillService', () => {
  it('should search skills by query', async () => {
    // Test searchSkills filters correctly
  });

  it('should generate unique slugs for duplicate titles', async () => {
    // Test slug generation with duplicates
  });
});

// tests/unit/slug.test.ts
describe('generateSlug', () => {
  it('should convert title to kebab-case', () => {
    expect(generateSlug('My Cool Skill', [])).toBe('my-cool-skill');
  });

  it('should append number for duplicates', () => {
    expect(generateSlug('My Skill', ['my-skill'])).toBe('my-skill-2');
    expect(generateSlug('My Skill', ['my-skill', 'my-skill-2'])).toBe('my-skill-3');
  });

  it('should handle special characters', () => {
    expect(generateSlug('Skill: Advanced (2024)!', [])).toBe('skill-advanced-2024');
  });
});
```

## Implementation Details

### Slug Generation Rules
1. Convert to lowercase
2. Replace spaces and special chars with hyphens
3. Remove consecutive hyphens
4. Trim hyphens from ends
5. If slug exists, append `-2`, `-3`, etc.

### Search Behavior
- Case-insensitive match
- Search fields: `title`, `summary`
- Partial matches allowed
- Empty query returns all

### Sort Behavior
- `likes`: descending (highest first)
- `downloads`: descending (highest first)
- Secondary sort: `createdAt` descending

### File Structure
```
data/
└── skills.json          # Array of SkillRecord
```

### Concurrency Strategy (MVP)
Simple file read/write with no locking. Accept that race conditions are possible for MVP. Document this limitation.

## Acceptance Criteria

- [ ] All repository tests pass
- [ ] All service tests pass
- [ ] All slug utility tests pass
- [ ] Search matches title and summary (case-insensitive)
- [ ] Sort works for both likes and downloads
- [ ] Slug generation handles duplicates correctly
- [ ] Counter increments work
- [ ] Repository uses temp directory in tests
- [ ] Data persists to JSON file correctly
- [ ] TypeScript types are complete

## Files to Create/Modify

```
src/
└── lib/
    └── skills/
        ├── types.ts          (exists from U0 - extend if needed)
        ├── repository.ts     (new)
        └── service.ts        (new)
tests/
└── unit/
    ├── repository.test.ts  (extend from U0)
    ├── service.test.ts     (new)
    └── slug.test.ts        (new)
```

## Dependencies

- U0: Foundation + TDD Harness (must be complete)

## Parallelization

Can run parallel with U2 (UI Shell) and U3 (Mock Auth) after U0 completes.

## Estimated Effort

4-5 hours

## Notes

- Keep repository interface simple - only what's needed for MVP
- Service layer should be pure TypeScript, no Next.js imports
- Slug generation must be deterministic for tests
- Consider edge cases: empty strings, very long titles, unicode
