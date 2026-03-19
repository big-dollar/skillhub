# U5: Upload Ingestion Stub

## Goal
Support logged-in upload and skill creation. Extract SKILL.md, generate README stub, create record.

## Deliverables

### 1. Ingestion Types
Create `src/lib/ingestion/types.ts`:

```typescript
export interface UploadInput {
  title: string;
  summary: string;
  file: File;
}

export interface IngestionResult {
  success: true;
  skillId: string;
  archivePath: string;
  skillMdPath: string;
  readmeStubPath: string;
}

export interface IngestionError {
  success: false;
  error: string;
  code: 'INVALID_FILE' | 'MISSING_SKILL_MD' | 'EXTRACTION_FAILED' | 'INVALID_SIZE';
}
```

### 2. Zip Extraction Service
Create `src/lib/ingestion/extract-skill-md.ts`:

```typescript
import AdmZip from 'adm-zip';
import fs from 'fs/promises';
import path from 'path';
import type { IngestionResult, IngestionError } from './types';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const SKILL_MD_FILENAME = 'SKILL.md';

export async function extractSkillMd(
  fileBuffer: Buffer,
  fileName: string,
  extractDir: string
): Promise<{ skillMdContent: string; skillMdPath: string } | IngestionError> {
  // Validate file size
  if (fileBuffer.length > MAX_FILE_SIZE) {
    return {
      success: false,
      error: `File size exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit`,
      code: 'INVALID_SIZE',
    };
  }

  // Validate file extension
  if (!fileName.toLowerCase().endsWith('.zip')) {
    return {
      success: false,
      error: 'Only .zip files are allowed',
      code: 'INVALID_FILE',
    };
  }

  try {
    const zip = new AdmZip(fileBuffer);
    const zipEntries = zip.getEntries();

    // Find SKILL.md (case-insensitive)
    const skillMdEntry = zipEntries.find(entry =>
      entry.entryName.toLowerCase().endsWith(SKILL_MD_FILENAME.toLowerCase())
    );

    if (!skillMdEntry) {
      return {
        success: false,
        error: `Archive must contain a ${SKILL_MD_FILENAME} file`,
        code: 'MISSING_SKILL_MD',
      };
    }

    // Extract SKILL.md content
    const skillMdContent = skillMdEntry.getData().toString('utf-8');

    // Save extracted file
    await fs.mkdir(extractDir, { recursive: true });
    const skillMdPath = path.join(extractDir, `${Date.now()}-skill.md`);
    await fs.writeFile(skillMdPath, skillMdContent);

    return { skillMdContent, skillMdPath };
  } catch (error) {
    return {
      success: false,
      error: `Failed to extract archive: ${error instanceof Error ? error.message : 'Unknown error'}`,
      code: 'EXTRACTION_FAILED',
    };
  }
}
```

### 3. README Stub Generator
Create `src/lib/ingestion/generate-readme-stub.ts`:

```typescript
import fs from 'fs/promises';
import path from 'path';

export async function generateReadmeStub(
  skillMdContent: string,
  title: string,
  outputDir: string
): Promise<string> {
  // Extract first paragraph (up to 500 chars)
  const firstParagraph = skillMdContent
    .split('\n\n')[0]
    .replace(/^#+\s*/, '') // Remove markdown headers
    .slice(0, 500);

  const stub = `# ${title}

> AI-generated README stub

## Overview

${firstParagraph || 'No description available.'}

## Contents

This skill package includes:
- \`SKILL.md\` - Skill documentation and instructions

---

*This README was automatically generated from SKILL.md. Please review and customize as needed.*
`;

  await fs.mkdir(outputDir, { recursive: true });
  const stubPath = path.join(outputDir, `${Date.now()}-readme.md`);
  await fs.writeFile(stubPath, stub);

  return stubPath;
}
```

### 4. Upload Service
Create `src/lib/ingestion/upload-service.ts`:

```typescript
import fs from 'fs/promises';
import path from 'path';
import { extractSkillMd } from './extract-skill-md';
import { generateReadmeStub } from './generate-readme-stub';
import { SkillService } from '@/lib/skills/service';
import type { UploadInput, IngestionResult, IngestionError } from './types';

export async function processUpload(
  input: UploadInput,
  uploaderName: string,
  dataDir: string,
  skillService: SkillService
): Promise<IngestionResult | IngestionError> {
  const uploadsDir = path.join(dataDir, 'uploads');
  const extractedDir = path.join(dataDir, 'extracted');
  const generatedDir = path.join(dataDir, 'generated');

  // Convert File to Buffer
  const arrayBuffer = await input.file.arrayBuffer();
  const fileBuffer = Buffer.from(arrayBuffer);

  // Step 1: Extract SKILL.md
  const extractionResult = await extractSkillMd(
    fileBuffer,
    input.file.name,
    extractedDir
  );

  if (!('skillMdContent' in extractionResult)) {
    return extractionResult;
  }

  const { skillMdContent, skillMdPath } = extractionResult;

  // Step 2: Save archive
  await fs.mkdir(uploadsDir, { recursive: true });
  const archivePath = path.join(uploadsDir, `${Date.now()}-${input.file.name}`);
  await fs.writeFile(archivePath, fileBuffer);

  // Step 3: Generate README stub
  const readmeStubPath = await generateReadmeStub(
    skillMdContent,
    input.title,
    generatedDir
  );

  // Step 4: Create skill record
  const skill = await skillService.createSkill({
    title: input.title,
    summary: input.summary,
    uploaderName,
    archivePath: path.relative(process.cwd(), archivePath),
    skillMdPath: path.relative(process.cwd(), skillMdPath),
    readmeStubPath: path.relative(process.cwd(), readmeStubPath),
  });

  return {
    success: true,
    skillId: skill.id,
    archivePath,
    skillMdPath,
    readmeStubPath,
  };
}
```

### 5. Upload API Route
Create `src/app/api/skills/upload/route.ts`:

```typescript
import { NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth/session';
import { processUpload } from '@/lib/ingestion/upload-service';
import { SkillService } from '@/lib/skills/service';
import { SkillRepository } from '@/lib/skills/repository';
import type { IngestionError } from '@/lib/ingestion/types';

export async function POST(request: Request) {
  try {
    // Verify authentication
    const session = await requireSession();

    // Parse form data
    const formData = await request.formData();
    const title = formData.get('title') as string;
    const summary = formData.get('summary') as string;
    const file = formData.get('file') as File;

    // Validate inputs
    if (!title || !summary || !file) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Process upload
    const dataDir = process.env.DATA_DIR || './data';
    const repo = new SkillRepository(dataDir);
    const service = new SkillService(repo);

    const result = await processUpload(
      { title, summary, file },
      session.uploaderName,
      dataDir,
      service
    );

    if (!result.success) {
      const error = result as IngestionError;
      return NextResponse.json(
        { success: false, error: error.error, code: error.code },
        { status: 400 }
      );
    }

    // Get the created skill
    const skill = await service.getSkillById(result.skillId);

    return NextResponse.json({
      success: true,
      skill,
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.error('Upload error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### 6. Upload Form Component
Create `src/components/upload/upload-form.tsx`:

```typescript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export function UploadForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);

    try {
      const response = await fetch('/api/skills/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        router.push(`/skills/${data.skill.slug}`);
      } else {
        setError(data.error || 'Upload failed');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileName(file.name);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload a Skill</CardTitle>
        <CardDescription>
          Share your skill with the community. Upload a .zip file containing a SKILL.md file.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="title" className="block text-sm font-medium mb-1">
              Title
            </label>
            <Input
              id="title"
              name="title"
              required
              placeholder="e.g., React Hooks Mastery"
            />
          </div>

          <div>
            <label htmlFor="summary" className="block text-sm font-medium mb-1">
              Summary
            </label>
            <textarea
              id="summary"
              name="summary"
              required
              rows={3}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
              placeholder="Brief description of what this skill teaches..."
            />
          </div>

          <div>
            <label htmlFor="file" className="block text-sm font-medium mb-1">
              Skill Package (.zip, max 10MB)
            </label>
            <Input
              id="file"
              name="file"
              type="file"
              accept=".zip"
              required
              onChange={handleFileChange}
            />
            {fileName && (
              <p className="text-sm text-muted-foreground mt-1">
                Selected: {fileName}
              </p>
            )}
          </div>

          {error && (
            <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">
              {error}
            </div>
          )}

          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? 'Uploading...' : 'Upload Skill'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
```

### 7. Update Upload Page
Update `src/app/upload/page.tsx`:

```typescript
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth/session';
import { UploadForm } from '@/components/upload/upload-form';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { LoginButton } from '@/components/auth/login-button';

export default async function UploadPage() {
  const session = await getSession();

  if (!session) {
    return (
      <div className="min-h-screen bg-background">
        <main className="container mx-auto px-4 py-8 max-w-2xl">
          <Card>
            <CardHeader>
              <CardTitle>Sign In Required</CardTitle>
              <CardDescription>
                You need to sign in to upload skills
              </CardDescription>
            </CardHeader>
            <CardContent>
              <LoginButton />
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <UploadForm />
      </main>
    </div>
  );
}
```

## Test-First Requirements

Write these tests BEFORE implementation:

```typescript
// tests/unit/extract-skill-md.test.ts
describe('extractSkillMd', () => {
  it('should extract SKILL.md from valid zip', async () => {
    // Arrange: Create zip with SKILL.md
    // Act: Call extractSkillMd
    // Assert: Returns content and path
  });

  it('should return error for missing SKILL.md', async () => {
    // Test: Zip without SKILL.md returns MISSING_SKILL_MD error
  });

  it('should return error for non-zip file', async () => {
    // Test: .txt file returns INVALID_FILE error
  });

  it('should return error for oversized file', async () => {
    // Test: >10MB file returns INVALID_SIZE error
  });

  it('should find SKILL.md case-insensitively', async () => {
    // Test: skill.md, Skill.md, etc. all work
  });
});

// tests/unit/generate-readme-stub.test.ts
describe('generateReadmeStub', () => {
  it('should generate stub with title', async () => {
    // Test: Stub includes title
  });

  it('should extract first paragraph', async () => {
    // Test: First paragraph extracted (up to 500 chars)
  });

  it('should include AI disclaimer', async () => {
    // Test: Stub mentions "AI-generated"
  });

  it('should handle empty content', async () => {
    // Test: Empty skill.md handled gracefully
  });
});

// tests/integration/upload-api.test.ts
describe('POST /api/skills/upload', () => {
  beforeEach(async () => {
    // Setup: Login session
  });

  it('should create skill from valid upload', async () => {
    // Arrange: Valid zip with SKILL.md
    // Act: POST upload
    // Assert: Skill created, files saved
  });

  it('should return 401 when anonymous', async () => {
    // Test: No session → 401
  });

  it('should return 400 for missing SKILL.md', async () => {
    // Test: Zip without SKILL.md → 400
  });

  it('should return 400 for invalid file type', async () => {
    // Test: .txt file → 400
  });

  it('should return 400 for oversized file', async () => {
    // Test: >10MB → 400
  });

  it('should save archive to uploads directory', async () => {
    // Test: File exists in data/uploads/
  });

  it('should extract SKILL.md to extracted directory', async () => {
    // Test: File exists in data/extracted/
  });

  it('should generate README stub to generated directory', async () => {
    // Test: File exists in data/generated/
  });

  it('should redirect to skill detail after upload', async () => {
    // Test: Client redirects to /skills/{slug}
  });
});
```

## Acceptance Criteria

- [ ] Valid zip with SKILL.md creates skill record
- [ ] Missing SKILL.md returns clear error (400)
- [ ] Non-zip file returns clear error (400)
- [ ] Oversized file (>10MB) returns clear error (400)
- [ ] Archive saved to `data/uploads/`
- [ ] SKILL.md extracted to `data/extracted/`
- [ ] README stub generated to `data/generated/`
- [ ] Created skill references all paths correctly
- [ ] Anonymous upload returns 401
- [ ] Upload form shows loading state
- [ ] Success redirects to skill detail page
- [ ] Errors shown in UI with clear messages
- [ ] All ingestion tests pass
- [ ] All upload API tests pass

## Files to Create

```
src/
├── lib/
│   └── ingestion/
│       ├── types.ts
│       ├── extract-skill-md.ts
│       ├── generate-readme-stub.ts
│       └── upload-service.ts
├── components/
│   └── upload/
│       └── upload-form.tsx
└── app/
    └── api/
        └── skills/
            └── upload/
                └── route.ts
```

## Dependencies to Add

```bash
pnpm add adm-zip
pnpm add -D @types/adm-zip
```

## Dependencies

- U1: Data Layer / Local Persistence
- U3: Mock Auth / Upload Gating

## Parallelization

Parallel with U4 (Like + Download APIs) after dependencies.

## Estimated Effort

4-5 hours

## Notes

- SKILL.md search is case-insensitive
- First paragraph extraction: split on double newline, take first
- README stub is deterministic (no randomness)
- File paths stored relative to project root
- Consider streaming for very large files (future)
- Archive filenames include timestamp to avoid collisions
- Clean up temp files on error (consider try/finally)
- Upload form validates on client (required fields) and server
