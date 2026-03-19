# U0: Foundation + TDD Harness

## Goal
Establish testable architecture before feature work. Create the testing infrastructure and conventions that all other units depend on.

## Deliverables

### 1. Add Test Dependencies
Install via pnpm:
```bash
pnpm add -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom @vitejs/plugin-react
```

### 2. Configure Vitest
Create `vitest.config.ts`:
```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

### 3. Update package.json Scripts
```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint",
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:run": "vitest run"
  }
}
```

### 4. Create Test Setup
Create `tests/setup.ts`:
```typescript
import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

afterEach(() => {
  cleanup();
});
```

### 5. Create Temp Directory Utilities
Create `tests/fixtures/temp-dir.ts`:
```typescript
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

export async function createTempDir(): Promise<string> {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'skillhub-test-'));
  return tempDir;
}

export async function cleanupTempDir(tempDir: string): Promise<void> {
  await fs.rm(tempDir, { recursive: true, force: true });
}
```

### 6. Define Domain Types
Create `src/lib/skills/types.ts`:
```typescript
export interface SkillRecord {
  id: string;
  slug: string;
  title: string;
  summary: string;
  uploaderName: string;
  archivePath: string;
  skillMdPath: string;
  readmeStubPath: string;
  likes: number;
  downloads: number;
  createdAt: string;
}

export type SortField = 'likes' | 'downloads';

export interface CreateSkillInput {
  title: string;
  summary: string;
  uploaderName: string;
  archivePath: string;
  skillMdPath: string;
  readmeStubPath: string;
}
```

### 7. Write Tests First

Create `tests/unit/repository.test.ts`:
```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createTempDir, cleanupTempDir } from '../fixtures/temp-dir';
import { SkillRepository } from '@/lib/skills/repository';

describe('SkillRepository', () => {
  let tempDir: string;
  let repo: SkillRepository;

  beforeEach(async () => {
    tempDir = await createTempDir();
    repo = new SkillRepository(tempDir);
  });

  afterEach(async () => {
    await cleanupTempDir(tempDir);
  });

  it('should load empty list when no data exists', async () => {
    const skills = await repo.list();
    expect(skills).toEqual([]);
  });

  it('should save and retrieve skills', async () => {
    // Write test here - will fail until implemented
  });
});
```

Create `tests/unit/homepage.test.tsx`:
```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import HomePage from '@/app/page';

describe('HomePage', () => {
  it('should render without errors', async () => {
    render(<HomePage />);
    expect(screen.getByRole('main')).toBeInTheDocument();
  });
});
```

## Test-First Requirements

Write these tests BEFORE any implementation:

1. **Repository Test**: Repository can load from temp JSON file
2. **Repository Test**: Repository can save to temp JSON file  
3. **Component Test**: Homepage renders without errors

## Acceptance Criteria

- [ ] `pnpm test` runs successfully
- [ ] `pnpm lint` passes
- [ ] At least one repository test passes
- [ ] At least one component render test passes
- [ ] Temp directory utilities isolate test data
- [ ] TypeScript types defined for SkillRecord
- [ ] Path alias `@/` works in tests

## Files to Create

```
tests/
├── setup.ts
├── fixtures/
│   └── temp-dir.ts
├── unit/
│   ├── repository.test.ts
│   └── homepage.test.tsx
src/
└── lib/
    └── skills/
        └── types.ts
vitest.config.ts
```

## Dependencies

None - this is the first unit.

## Estimated Effort

2-3 hours

## Notes

- Keep types minimal - only what's needed for MVP
- Temp directory utilities must clean up after tests
- Tests should fail initially (TDD)
- Don't implement repository logic yet - just the interface and failing tests
