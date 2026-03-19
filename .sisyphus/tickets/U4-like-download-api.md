# U4: APIs / Like + Counted Download

## Goal
Expose thin mutation adapters over the service layer. Downloads must increment counter before streaming file.

## Deliverables

### 1. Like Route Handler
Create `src/app/api/skills/[id]/like/route.ts`:

```typescript
import { NextResponse } from 'next/server';
import { SkillService } from '@/lib/skills/service';
import { SkillRepository } from '@/lib/skills/repository';

interface LikeRouteParams {
  params: { id: string };
}

export async function POST(_request: Request, { params }: LikeRouteParams) {
  try {
    const repo = new SkillRepository(process.env.DATA_DIR || './data');
    const service = new SkillService(repo);
    
    const skill = await service.likeSkill(params.id);
    
    return NextResponse.json({ 
      success: true, 
      skill,
      likes: skill.likes 
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Skill not found') {
      return NextResponse.json(
        { success: false, error: 'Skill not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### 2. Download Route Handler
Create `src/app/api/skills/[id]/download/route.ts`:

```typescript
import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { SkillService } from '@/lib/skills/service';
import { SkillRepository } from '@/lib/skills/repository';

interface DownloadRouteParams {
  params: { id: string };
}

export async function GET(_request: Request, { params }: DownloadRouteParams) {
  try {
    const repo = new SkillRepository(process.env.DATA_DIR || './data');
    const service = new SkillService(repo);
    
    // Get skill first to verify existence
    const skill = await service.getSkillById(params.id);
    
    if (!skill) {
      return NextResponse.json(
        { error: 'Skill not found' },
        { status: 404 }
      );
    }
    
    // Check if file exists
    const filePath = path.join(process.cwd(), skill.archivePath);
    try {
      await fs.access(filePath);
    } catch {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      );
    }
    
    // Increment download counter FIRST
    await service.recordDownload(params.id);
    
    // Read file
    const fileBuffer = await fs.readFile(filePath);
    const fileName = path.basename(skill.archivePath);
    
    // Return file with download headers
    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Content-Length': fileBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error('Download error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### 3. Update Service Layer
Add to `src/lib/skills/service.ts`:

```typescript
export class SkillService {
  // ... existing methods

  async getSkillById(id: string): Promise<SkillRecord | null> {
    return this.repository.getById(id);
  }

  // likeSkill and recordDownload already in U1
}
```

### 4. Update Repository
Add to `src/lib/skills/repository.ts`:

```typescript
export class SkillRepository implements ISkillRepository {
  // ... existing methods

  async getById(id: string): Promise<SkillRecord | null> {
    const skills = await this.readDb();
    return skills.find(s => s.id === id) || null;
  }
}
```

### 5. Client-Side Like Button
Update `src/components/skills/like-button.tsx`:

```typescript
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Heart } from 'lucide-react';

interface LikeButtonProps {
  skillId: string;
  initialLikes: number;
}

export function LikeButton({ skillId, initialLikes }: LikeButtonProps) {
  const [likes, setLikes] = useState(initialLikes);
  const [isLoading, setIsLoading] = useState(false);

  const handleLike = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/skills/${skillId}/like`, {
        method: 'POST',
      });
      
      if (response.ok) {
        const data = await response.json();
        setLikes(data.likes);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button 
      onClick={handleLike} 
      variant="secondary"
      disabled={isLoading}
    >
      <Heart className="w-4 h-4 mr-2" />
      {isLoading ? '...' : likes}
    </Button>
  );
}
```

Update skill detail page to use LikeButton:

```typescript
// In src/app/skills/[slug]/page.tsx
import { LikeButton } from '@/components/skills/like-button';

// Replace the form with:
<LikeButton skillId={skill.id} initialLikes={skill.likes} />
```

## Test-First Requirements

Write these tests BEFORE implementation:

```typescript
// tests/integration/like-api.test.ts
describe('POST /api/skills/{id}/like', () => {
  beforeEach(async () => {
    // Seed repository with test skill
  });

  it('should increment like count', async () => {
    // Arrange: Skill with 5 likes
    // Act: POST to like endpoint
    // Assert: Response shows 6 likes
  });

  it('should return updated skill', async () => {
    // Test: Response includes full skill object
  });

  it('should return 404 for missing skill', async () => {
    // Test: Invalid ID returns 404
  });

  it('should handle concurrent likes', async () => {
    // Test: Multiple rapid likes increment correctly
  });

  it('should return success true on success', async () => {
    // Test: Response has success: true
  });
});

// tests/integration/download-api.test.ts
describe('GET /api/skills/{id}/download', () => {
  beforeEach(async () => {
    // Seed repository with test skill and file
  });

  it('should return file with correct headers', async () => {
    // Test: Response has Content-Type: application/zip
    // Test: Response has Content-Disposition: attachment
  });

  it('should increment download count BEFORE response', async () => {
    // Arrange: Skill with 3 downloads
    // Act: GET download endpoint
    // Assert: Skill now has 4 downloads (check after response)
  });

  it('should return file content', async () => {
    // Test: Response body matches file content
  });

  it('should return 404 for missing skill', async () => {
    // Test: Invalid ID returns 404
  });

  it('should return 404 for missing file', async () => {
    // Test: Skill exists but file deleted returns 404
  });

  it('should handle large files', async () => {
    // Test: Files up to 10MB stream correctly
  });
});
```

## Acceptance Criteria

- [ ] Like endpoint increments counter and returns new count
- [ ] Like endpoint returns 404 for missing skill
- [ ] Download endpoint streams file with correct headers
- [ ] Download count increments exactly once per request
- [ ] Download happens AFTER counter increment (no race condition)
- [ ] Download returns 404 for missing skill
- [ ] Download returns 404 for missing file
- [ ] Content-Type header set to application/zip
- [ ] Content-Disposition header triggers download
- [ ] Client-side like button updates without page refresh
- [ ] All integration tests pass

## Files to Create/Modify

```
src/
├── app/
│   └── api/
│       └── skills/
│           └── [id]/
│               ├── like/
│               │   └── route.ts
│               └── download/
│                   └── route.ts
├── components/
│   └── skills/
│       └── like-button.tsx
├── lib/
│   └── skills/
│       ├── repository.ts    (add getById)
│       └── service.ts       (add getById)
```

## Dependencies

- U1: Data Layer / Local Persistence (must be complete)

## Parallelization

Parallel with U5 (Upload Ingestion) after U1.

## Estimated Effort

2-3 hours

## Notes

- Download counter MUST increment before file streaming
- Use streaming for large files (consider ReadableStream for >10MB)
- Anonymous likes allowed (no deduplication for MVP)
- Consider rate limiting for likes/downloads in future
- Error handling: distinguish between skill not found vs file not found
- Client-side like button should show loading state
- Consider optimistic UI updates for better UX
