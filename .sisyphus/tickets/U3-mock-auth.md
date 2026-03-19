# U3: Mock Auth / Upload Gating

## Goal
Implement the simplest possible uploader login boundary. No real auth provider, just a cookie-based mock session.

## Deliverables

### 1. Session Types
Create `src/lib/auth/types.ts`:

```typescript
export interface Session {
  uploaderName: string;
  loggedInAt: string;
}

export interface SessionPayload {
  uploaderName: string;
}
```

### 2. Session Helpers
Create `src/lib/auth/session.ts`:

```typescript
import { cookies } from 'next/headers';
import type { Session, SessionPayload } from './types';

const COOKIE_NAME = 'skillhub-session';
const SESSION_DURATION_DAYS = 7;

export async function getSession(): Promise<Session | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(COOKIE_NAME);
  
  if (!sessionCookie?.value) {
    return null;
  }
  
  try {
    return JSON.parse(sessionCookie.value) as Session;
  } catch {
    return null;
  }
}

export async function setSession(payload: SessionPayload): Promise<void> {
  const cookieStore = await cookies();
  const session: Session = {
    ...payload,
    loggedInAt: new Date().toISOString(),
  };
  
  cookieStore.set(COOKIE_NAME, JSON.stringify(session), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * SESSION_DURATION_DAYS, // 7 days
    path: '/',
  });
}

export async function clearSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function requireSession(): Promise<Session> {
  const session = await getSession();
  if (!session) {
    throw new Error('Unauthorized');
  }
  return session;
}
```

### 3. Mock Login Route
Create `src/app/api/auth/mock-login/route.ts`:

```typescript
import { NextResponse } from 'next/server';
import { setSession } from '@/lib/auth/session';

export async function POST() {
  // Hardcoded mock uploader for MVP
  await setSession({
    uploaderName: 'Demo Uploader',
  });
  
  return NextResponse.json({ success: true });
}
```

### 4. Mock Logout Route
Create `src/app/api/auth/mock-logout/route.ts`:

```typescript
import { NextResponse } from 'next/server';
import { clearSession } from '@/lib/auth/session';

export async function POST() {
  await clearSession();
  return NextResponse.json({ success: true });
}
```

### 5. Auth Components

Create `src/components/auth/`:

**LoginButton** (`login-button.tsx`):
```typescript
'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

export function LoginButton() {
  const router = useRouter();

  const handleLogin = async () => {
    await fetch('/api/auth/mock-login', { method: 'POST' });
    router.refresh();
  };

  return (
    <Button onClick={handleLogin} variant="ghost" size="sm">
      Sign In
    </Button>
  );
}
```

**LogoutButton** (`logout-button.tsx`):
```typescript
'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

export function LogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    await fetch('/api/auth/mock-logout', { method: 'POST' });
    router.refresh();
  };

  return (
    <Button onClick={handleLogout} variant="ghost" size="sm">
      Sign Out
    </Button>
  );
}
```

**AuthStatus** (`auth-status.tsx`):
```typescript
import { getSession } from '@/lib/auth/session';
import { LoginButton } from './login-button';
import { LogoutButton } from './logout-button';

export async function AuthStatus() {
  const session = await getSession();

  if (session) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">{session.uploaderName}</span>
        <LogoutButton />
      </div>
    );
  }

  return <LoginButton />;
}
```

### 6. Update Header
Modify `src/components/layout/header.tsx`:

```typescript
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { AuthStatus } from '@/components/auth/auth-status';

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
          <AuthStatus />
        </nav>
      </div>
    </header>
  );
}
```

### 7. Gated Upload Page
Create `src/app/upload/page.tsx`:

```typescript
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth/session';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
        <h1 className="text-2xl font-bold mb-6">Upload Skill</h1>
        {/* Upload form will be added in U5 */}
        <p>Upload form coming soon...</p>
      </main>
    </div>
  );
}
```

## Test-First Requirements

Write these tests BEFORE implementation:

```typescript
// tests/unit/auth.test.ts
describe('Auth', () => {
  describe('getSession', () => {
    it('should return null when no session cookie', async () => {
      // Test: No cookie → null
    });

    it('should return session when cookie exists', async () => {
      // Test: Valid cookie → session object
    });

    it('should return null for invalid cookie', async () => {
      // Test: Invalid JSON → null
    });
  });

  describe('setSession', () => {
    it('should set session cookie', async () => {
      // Test: Cookie set with correct attributes
    });

    it('should include loggedInAt timestamp', async () => {
      // Test: Session has ISO timestamp
    });
  });

  describe('clearSession', () => {
    it('should remove session cookie', async () => {
      // Test: Cookie deleted
    });
  });

  describe('requireSession', () => {
    it('should return session when authenticated', async () => {
      // Test: Valid session returned
    });

    it('should throw when not authenticated', async () => {
      // Test: Error thrown
    });
  });
});

// tests/integration/auth-routes.test.ts
describe('Auth Routes', () => {
  describe('POST /api/auth/mock-login', () => {
    it('should set session cookie', async () => {
      // Test: Login sets cookie
    });

    it('should return success', async () => {
      // Test: 200 response
    });
  });

  describe('POST /api/auth/mock-logout', () => {
    it('should clear session cookie', async () => {
      // Test: Logout clears cookie
    });

    it('should return success', async () => {
      // Test: 200 response
    });
  });
});

// tests/integration/upload-gate.test.ts
describe('Upload Page Gate', () => {
  it('should show sign-in CTA when anonymous', async () => {
    // Test: Anonymous user sees login prompt
  });

  it('should show upload form when logged in', async () => {
    // Test: Logged-in user sees form
  });

  it('should redirect or block upload API when anonymous', async () => {
    // Test: API returns 401
  });
});
```

## Acceptance Criteria

- [ ] Anonymous `/upload` shows sign-in CTA
- [ ] Login button sets cookie and refreshes session
- [ ] Logout clears cookie and returns to anonymous state
- [ ] Header shows uploader name when logged in
- [ ] Session persists across page navigations
- [ ] Session cookie is HTTP-only and secure in production
- [ ] Session expires after 7 days
- [ ] All auth tests pass
- [ ] All route tests pass
- [ ] Upload gate tests pass

## Files to Create

```
src/
├── lib/
│   └── auth/
│       ├── types.ts
│       └── session.ts
├── components/
│   └── auth/
│       ├── login-button.tsx
│       ├── logout-button.tsx
│       └── auth-status.tsx
└── app/
    ├── api/
    │   └── auth/
    │       ├── mock-login/
    │       │   └── route.ts
    │       └── mock-logout/
    │           └── route.ts
    └── upload/
        └── page.tsx
```

## Dependencies

- U0: Foundation + TDD Harness

## Parallelization

Parallel with U1 (Data Layer) and U2 (UI Shell) after U0.

## Estimated Effort

2-3 hours

## Notes

- Keep auth minimal - just enough for MVP upload gating
- No password, no JWT, no external provider
- Single hardcoded uploader is fine for MVP
- Cookie attributes: httpOnly, secure in prod, sameSite lax
- Session refresh on every request (simplest approach)
- Consider adding session validation middleware later
