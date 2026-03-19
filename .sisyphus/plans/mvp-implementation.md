# SkillHub MVP Implementation Plan

## Overview
Greenfield Next.js App Router MVP for a skill-sharing website with local file-based persistence.

## Tech Stack
- Next.js 16.1.7 (App Router)
- React 19.2.3
- TypeScript 5 (strict mode)
- Tailwind CSS v4
- pnpm package manager
- Vitest + Testing Library (TDD)

## Architecture Principles
1. **Thin Adapters**: Next.js routes/pages are thin wrappers around pure services
2. **Pure Services**: Business logic in `src/lib/**` with no Next.js dependencies
3. **Local Persistence**: JSON files + local storage, no Supabase for MVP
4. **TDD-First**: Tests written before implementation for each slice
5. **Temp Fixtures**: All tests use isolated temp directories

## Domain Model

### SkillRecord
```typescript
interface SkillRecord {
  id: string;                    // UUID
  slug: string;                  // URL-safe identifier
  title: string;                 // Display title
  summary: string;               // Short description
  uploaderName: string;          // Mock uploader display name
  archivePath: string;           // Path to saved .zip
  skillMdPath: string;           // Path to extracted SKILL.md
  readmeStubPath: string;        // Path to generated README stub
  likes: number;                 // Like counter
  downloads: number;             // Download counter
  createdAt: string;             // ISO timestamp
}
```

### Search & Sort
- **Search fields**: title, summary, extracted SKILL.md content
- **Sort options**: `likes` | `downloads`
- **Default sort**: `likes` descending

### Upload Requirements
- Format: `.zip` only
- Required content: `SKILL.md` file inside archive
- Max size: 10MB (configurable)
- Extraction: Extract SKILL.md to `data/extracted/`
- README stub: Deterministic local generation

## File Structure

```
src/
├── app/
│   ├── page.tsx                    # Homepage with search/sort
│   ├── layout.tsx                  # Root layout (exists)
│   ├── globals.css                 # Tailwind styles (exists)
│   ├── skills/
│   │   └── [slug]/
│   │       └── page.tsx            # Skill detail page
│   ├── upload/
│   │   └── page.tsx                # Upload form (gated)
│   └── api/
│       ├── skills/
│       │   └── [id]/
│       │       ├── like/
│       │       │   └── route.ts    # POST like
│       │       └── download/
│       │           └── route.ts    # GET counted download
│       └── auth/
│           ├── mock-login/
│           │   └── route.ts        # POST login
│           └── mock-logout/
│               └── route.ts        # POST logout
├── lib/
│   ├── skills/
│   │   ├── types.ts                # Domain types
│   │   ├── repository.ts           # File-backed storage
│   │   └── service.ts              # Business logic
│   ├── auth/
│   │   └── session.ts              # Mock session helpers
│   └── ingestion/
│       ├── extract-skill-md.ts     # Zip extraction
│       └── generate-readme-stub.ts # AI stub generation
├── components/
│   ├── ui/                         # Reusable UI primitives
│   ├── skills/                     # Skill-specific components
│   └── layout/                     # Layout components
└── tests/
    ├── unit/                       # Unit tests
    ├── integration/                # Integration tests
    └── fixtures/                   # Test fixtures

data/
├── skills.json                     # Skill records store
├── uploads/                        # Saved .zip archives
├── extracted/                      # Extracted SKILL.md files
└── generated/                      # Generated README stubs
```

## Execution Units

### U0: Foundation + TDD Harness
**Goal**: Establish testable architecture before feature work

**Executable QA Notes**:
- Run `pnpm test:run` from repo root to validate the Vitest jsdom harness, alias resolution, temp-dir fixtures, repository persistence test, and homepage render test.
- Run `pnpm lint` from repo root after test changes to catch strict TypeScript/Next.js lint regressions before starting U1.
- If a test touches filesystem state, require `tests/fixtures/temp-dir.ts` helpers so no U0/U1 test writes into real `data/` paths.
- **U2 COMPLETED**: The UI Shell/Browse Experience has been implemented using temporary mock data.
- **DATA LAYER NOTE**: The UI currently depends on `src/lib/mock-data.ts`. When implementing U1, replace the imports in `src/app/page.tsx` and `src/app/skills/[slug]/page.tsx` to use the real repository instead. The interface `Skill` and `getSkills`/`getSkillBySlug` signatures should match the expected domain models.
- **UI COMPONENTS**: All necessary UI primitives for MVP (Header, SkillCard, layout) are built with Tailwind classes in `src/components/`. No external UI libraries needed.
- **ICONS**: Used inline SVG icons. No external icon library dependencies added.
- **THEMING**: Implemented dark mode out of the box in `globals.css` with a nice lightweight "developer aesthetic".

**Deliverables**:
- [ ] Add Vitest + Testing Library dependencies
- [ ] Configure test scripts in package.json
- [ ] Create temp directory fixture utilities
- [ ] Define shared domain types
- [ ] Establish path conventions (@/* alias)
- [ ] One passing repository unit test
- [ ] One passing page render test

**Test-First Requirements**:
```typescript
// Before any implementation, write tests for:
// 1. Repository can load from temp JSON file
// 2. Repository can save to temp JSON file
// 3. Homepage renders without errors
```

**Acceptance Criteria**:
- `pnpm test` runs successfully
- `pnpm lint` passes
- At least one repository test passes
- At least one component render test passes
- Temp directory utilities isolate test data

**Estimated Effort**: 2-3 hours
**Dependencies**: None (first unit)
**Parallelization**: Must complete before U1, U2, U3

---

### U1: Data Layer / Local Persistence
**Goal**: Create storage-agnostic repository backed by local JSON/files

**Deliverables**:
- [ ] `src/lib/skills/types.ts` - Domain types
- [ ] `src/lib/skills/repository.ts` - File-backed storage
- [ ] `src/lib/skills/service.ts` - Business logic
- [ ] Seed fixture loader for tests

**Repository Interface**:
```typescript
interface SkillRepository {
  list(opts: { q?: string; sort?: 'likes' | 'downloads' }): Promise<SkillRecord[]>;
  getBySlug(slug: string): Promise<SkillRecord | null>;
  create(skill: Omit<SkillRecord, 'id' | 'createdAt'>): Promise<SkillRecord>;
  incrementLikes(id: string): Promise<SkillRecord>;
  incrementDownloads(id: string): Promise<SkillRecord>;
}
```

**Service Functions**:
- `searchSkills(query: string, sort: SortField)`
- `getSkillBySlug(slug: string)`
- `createSkill(input: CreateSkillInput)`
- `likeSkill(id: string)`
- `recordDownload(id: string)`
- `generateSlug(title: string)`

**Test-First Requirements**:
```typescript
// Write tests BEFORE implementation:
// 1. list() returns all skills sorted by likes
// 2. list({ sort: 'downloads' }) sorts by downloads
// 3. list({ q: 'react' }) filters by search term
// 4. getBySlug() returns matching skill or null
// 5. create() generates unique slug from title
// 6. incrementLikes() increases count by 1
// 7. incrementDownloads() increases count by 1
// 8. All writes persist to temp file and reload correctly
```

**Acceptance Criteria**:
- All repository tests pass
- All service tests pass
- Search matches title, summary, and skillMd content
- Sort works for both likes and downloads
- Slug generation handles duplicates (title-2, title-3)
- Counter increments are atomic (file locking or optimistic)
- Repository uses temp directory in tests

**Estimated Effort**: 4-5 hours
**Dependencies**: U0
**Parallelization**: Can run parallel with U2, U3 after U0

---

### U2: UI Shell / Browse Experience
**Goal**: Replace starter UI with polished browsing experience

**Deliverables**:
- [ ] Homepage (`src/app/page.tsx`)
  - Search input with debounce
  - Sort tabs/buttons (Likes | Downloads)
  - Skill cards grid
  - Empty state
  - Loading state
- [ ] Skill Detail Page (`src/app/skills/[slug]/page.tsx`)
  - Title, summary, metadata
  - Like button
  - Download CTA
  - README stub preview
- [ ] Header component with session state
- [ ] Skill card component
- [ ] Responsive layout (mobile + desktop)
- [ ] Tailwind theme extensions

**Visual Design Direction**:
- **Base**: Warm neutral background (not pure white)
- **Typography**: Editorial, readable hierarchy
- **Accents**: Subtle gradients or patterns
- **Cards**: Clean borders, hover states
- **Motion**: Restrained, purposeful transitions
- **Empty State**: Helpful illustration or icon

**Test-First Requirements**:
```typescript
// Write tests BEFORE implementation:
// 1. Homepage renders seeded skills
// 2. Search query updates URL and filters results
// 3. Sort control changes ordering
// 4. Empty search shows empty state
// 5. Skill detail page renders with correct data
// 6. Like button shows current count
// 7. Download link points to API route
```

**Acceptance Criteria**:
- Homepage displays skills in grid layout
- Search filters skills in real-time (debounced)
- Sort toggle switches between likes/downloads
- Detail page shows all skill metadata
- Like button is interactive (calls API)
- Download button triggers counted download
- Responsive: works on 320px mobile and 1440px desktop
- Dark mode support (respects system preference)
- No visual regressions from starter template

**Estimated Effort**: 6-8 hours
**Dependencies**: U0 for test setup; can mock service initially
**Parallelization**: Parallel with U1, U3 after U0

---

### U3: Mock Auth / Upload Gating
**Goal**: Implement simplest possible uploader login boundary

**Deliverables**:
- [ ] `src/lib/auth/session.ts` - Session helpers
- [ ] `src/app/api/auth/mock-login/route.ts` - Login handler
- [ ] `src/app/api/auth/mock-logout/route.ts` - Logout handler
- [ ] Gated `/upload` page behavior
- [ ] Header shows login/logout state

**Session Design**:
- HTTP-only cookie: `skillhub-session`
- Cookie value: simple JSON with uploader name
- No password, no JWT, no external auth
- Single hardcoded uploader: "Demo Uploader"

**Test-First Requirements**:
```typescript
// Write tests BEFORE implementation:
// 1. Anonymous user cannot access /upload (redirects or shows CTA)
// 2. POST /api/auth/mock-login sets session cookie
// 3. POST /api/auth/mock-logout clears session cookie
// 4. Logged-in user sees upload form
// 5. Session cookie persists across requests
```

**Acceptance Criteria**:
- Anonymous `/upload` shows sign-in CTA or redirects
- Login button sets cookie and refreshes session
- Logout clears cookie and returns to anonymous state
- Header shows uploader name when logged in
- Session works across page navigations
- No real authentication provider needed

**Estimated Effort**: 2-3 hours
**Dependencies**: U0
**Parallelization**: Parallel with U1, U2 after U0

---

### U4: APIs / Like + Counted Download
**Goal**: Expose thin mutation adapters over service layer

**Deliverables**:
- [ ] `src/app/api/skills/[id]/like/route.ts` - POST handler
- [ ] `src/app/api/skills/[id]/download/route.ts` - GET handler

**Like Endpoint**:
- POST /api/skills/{id}/like
- Returns updated skill with new like count
- Anonymous likes allowed (no deduplication for MVP)

**Download Endpoint**:
- GET /api/skills/{id}/download
- Increments download counter first
- Streams file from `data/uploads/`
- Sets Content-Disposition header for download
- Returns 404 if skill or file not found

**Test-First Requirements**:
```typescript
// Write tests BEFORE implementation:
// 1. POST like returns 200 and updated count
// 2. POST like increments counter in repository
// 3. GET download returns file with correct headers
// 4. GET download increments counter before response
// 5. GET download returns 404 for missing skill
// 6. GET download returns 404 for missing file
```

**Acceptance Criteria**:
- Like endpoint increments counter and returns new count
- Download endpoint streams file correctly
- Download count increments exactly once per request
- Proper error handling for missing resources
- Content-Type headers set correctly
- Works with fetch/XHR from UI

**Estimated Effort**: 2-3 hours
**Dependencies**: U1
**Parallelization**: Parallel with U5 after U1

---

### U5: Upload Ingestion Stub
**Goal**: Support logged-in upload and skill creation

**Deliverables**:
- [ ] Upload form component
- [ ] `src/app/api/skills/upload/route.ts` - Upload handler
- [ ] `src/lib/ingestion/extract-skill-md.ts` - Zip extraction
- [ ] `src/lib/ingestion/generate-readme-stub.ts` - Stub generation

**Upload Flow**:
1. Validate logged-in session
2. Validate file is .zip and under size limit
3. Save archive to `data/uploads/{id}.zip`
4. Extract SKILL.md to `data/extracted/{id}.md`
5. If SKILL.md missing → return 400 error
6. Generate README stub to `data/generated/{id}-readme.md`
7. Create SkillRecord via repository
8. Return created skill

**README Stub Generation**:
- Deterministic template-based generation
- Extracts first paragraph from SKILL.md
- Adds "AI-generated draft" disclaimer
- Simple markdown output

**Test-First Requirements**:
```typescript
// Write tests BEFORE implementation:
// 1. Valid zip with SKILL.md creates skill record
// 2. Missing SKILL.md returns 400 error
// 3. Non-zip file returns 400 error
// 4. Archive saved to correct path
// 5. SKILL.md extracted to correct path
// 6. README stub generated to correct path
// 7. Created skill references all paths correctly
// 8. Anonymous upload returns 401
```

**Acceptance Criteria**:
- Upload form accepts title, summary, and zip file
- Valid upload creates browseable skill immediately
- Missing SKILL.md shows clear error message
- File size validation (10MB limit)
- Generated README stub contains extracted content
- All files saved to correct locations
- Upload only works when logged in
- Form shows loading state during processing

**Estimated Effort**: 4-5 hours
**Dependencies**: U1, U3
**Parallelization**: Parallel with U4 after dependencies

---

### U6: Verification / Hardening
**Goal**: Prove MVP works end-to-end locally

**Deliverables**:
- [ ] Integration tests for full flows
- [ ] Seeded demo data for manual testing
- [ ] Smoke checklist documentation
- [ ] Edge case validation
- [ ] Performance spot checks

**Integration Tests**:
```typescript
// Test complete flows:
// 1. Browse flow: seed → search → sort → open detail
// 2. Upload flow: login → upload → verify created → browse
// 3. Like flow: seed → like → verify count
// 4. Download flow: seed → download → verify count + file
// 5. Search flow: seed with variations → search accuracy
```

**Demo Data**:
- 10-15 realistic skill records
- Mix of titles, summaries, like/download counts
- At least one with extracted SKILL.md content

**Smoke Checklist**:
- [ ] Homepage loads with skills
- [ ] Search filters correctly
- [ ] Sort by likes works
- [ ] Sort by downloads works
- [ ] Detail page shows correct data
- [ ] Like increments counter
- [ ] Download increments counter and serves file
- [ ] Anonymous cannot upload
- [ ] Login enables upload
- [ ] Valid upload creates skill
- [ ] Invalid upload shows error
- [ ] Mobile layout works
- [ ] Desktop layout works
- [ ] Dark mode works

**Acceptance Criteria**:
- All integration tests pass
- Manual smoke checklist completed
- Demo data loads successfully
- No console errors in browser
- No TypeScript errors
- All lint checks pass
- `pnpm build` completes successfully

**Estimated Effort**: 3-4 hours
**Dependencies**: U2, U4, U5
**Parallelization**: Final phase (sequential)

---

## Execution Order

```
U0 (Foundation)
    │
    ├──→ U1 (Data Layer) ──┐
    │                       │
    ├──→ U2 (UI Shell) ─────┼──→ U4 (APIs) ──┐
    │                       │                │
    └──→ U3 (Mock Auth) ────┴──→ U5 (Upload)─┘
                                              │
                                              ↓
                                            U6 (Verification)
```

**Phase 1**: U0 (2-3h)
**Phase 2**: U1 + U2 + U3 in parallel (6-8h)
**Phase 3**: U4 + U5 in parallel (4-5h)
**Phase 4**: U6 (3-4h)

**Total Estimated**: 15-20 hours

---

## Atomic Commit Strategy

```bash
# U0
feat: add vitest harness and test fixtures

# U1
feat: add skill domain types and local repository
feat: add skill service with search sort and counters
test: add repository and service unit tests

# U2
feat: build searchable sortable skill listing page
feat: add skill detail page with stats
feat: add responsive skill cards and layout
style: implement lightweight editorial design system

# U3
feat: add mock uploader session and auth routes
feat: gate upload page behind session

# U4
feat: add like endpoint with counter increment
feat: add counted download endpoint with file streaming

# U5
feat: add zip upload form and API handler
feat: extract SKILL.md from uploaded archives
feat: generate deterministic README stub
feat: wire upload ingestion to skill creation

# U6
test: add integration tests for browse upload like download
chore: add demo seed data and smoke checklist
docs: add verification runbook
```

---

## Testing Strategy

### Unit Tests (Vitest)
- Repository methods
- Service functions
- Pure utilities (slug generation, etc.)
- Ingestion helpers

### Integration Tests (Vitest + Testing Library)
- Route handlers
- Page components with mocked services
- Full flow simulations

### Manual Verification
- Smoke checklist per U6
- Visual regression spot checks
- Mobile/desktop responsive testing

### Test Data Isolation
- All tests use temp directories
- Fixtures loaded from `tests/fixtures/`
- No test writes to real `data/` directory
- Automatic cleanup after each test

---

## Dependencies to Add

```json
{
  "devDependencies": {
    "vitest": "^2.x",
    "@testing-library/react": "^16.x",
    "@testing-library/jest-dom": "^6.x",
    "@testing-library/user-event": "^14.x",
    "jsdom": "^24.x",
    "@vitejs/plugin-react": "^4.x"
  },
  "dependencies": {
    "adm-zip": "^0.5.x"  // For zip extraction
  }
}
```

---

## Risk Mitigation

1. **File Concurrency**: Use simple file locking or accept race conditions for MVP
2. **Large Uploads**: Set 10MB limit, validate before processing
3. **Missing SKILL.md**: Clear error message, reject upload
4. **Path Traversal**: Validate filenames, use UUID-based storage
5. **Session Security**: HTTP-only cookie, no sensitive data stored

---

## Post-MVP Considerations

- Replace file storage with Supabase/S3
- Add real authentication (OAuth)
- Implement like deduplication (user tracking)
- Add vector search for skills
- Add comments and reviews
- Add payment/subscription features
- Add skill versioning

---

## Verification Complete Criteria

- [ ] All unit tests pass
- [ ] All integration tests pass
- [ ] Manual smoke checklist complete
- [ ] `pnpm build` succeeds
- [ ] `pnpm lint` passes
- [ ] No console errors in browser
- [ ] Demo data loads and displays correctly
- [ ] Upload → Browse → Download flow works end-to-end
