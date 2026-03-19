import { cookies } from "next/headers";
import type { NextResponse } from "next/server";
import type { Session, SessionPayload, User } from "@/lib/auth/types";

export const COOKIE_NAME = "skillhub-session";
export const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 7;

type SessionSource = Headers | Request | string | undefined;

export function createSession(payload: SessionPayload, now = new Date()): Session {
  return {
    user: payload.user,
    loggedInAt: now.toISOString(),
    provider: payload.provider ?? "github",
  };
}

export function encodeSession(session: Session): string {
  return encodeURIComponent(JSON.stringify(session));
}

function isGitHubUser(user: Partial<User> & Record<string, unknown>): boolean {
  return typeof user.id === "number" && typeof user.login === "string";
}

function isFeishuUser(user: Partial<User> & Record<string, unknown>): boolean {
  return typeof user.id === "string" && typeof user.name === "string";
}

export function decodeSession(value?: string | null): Session | null {
  if (!value) {
    return null;
  }

  try {
    const parsed = JSON.parse(decodeCookieValue(value)) as Partial<Session>;

    if (!parsed.user || typeof parsed.loggedInAt !== "string") {
      return null;
    }

    const user = parsed.user as unknown as Record<string, unknown>;
    const provider = parsed.provider ?? "github";

    // Handle GitHub user
    if (isGitHubUser(user)) {
      return {
        user: {
          id: user.id as number,
          login: user.login as string,
          name: (user.name as string | undefined) ?? (user.login as string),
          avatar_url: (user.avatar_url as string | undefined) ?? "",
          email: (user.email as string | null | undefined) ?? null,
        },
        loggedInAt: parsed.loggedInAt,
        provider,
      };
    }

    // Handle Feishu user
    if (isFeishuUser(user)) {
      return {
        user: {
          id: user.id as string,
          name: user.name as string,
          avatar_url: (user.avatar_url as string | undefined) ?? "",
          email: (user.email as string | null | undefined) ?? null,
          mobile: (user.mobile as string | null | undefined) ?? null,
        },
        loggedInAt: parsed.loggedInAt,
        provider,
      };
    }

    return null;
  } catch {
    return null;
  }
}

export async function getSession(source?: SessionSource): Promise<Session | null> {
  if (typeof source === "string") {
    return decodeSession(readCookie(source, COOKIE_NAME));
  }

  if (source instanceof Request) {
    return decodeSession(readCookie(source.headers.get("cookie") ?? "", COOKIE_NAME));
  }

  if (source instanceof Headers) {
    return decodeSession(readCookie(source.get("cookie") ?? "", COOKIE_NAME));
  }

  const cookieStore = await cookies();
  return decodeSession(cookieStore.get(COOKIE_NAME)?.value);
}

export async function requireSession(source?: SessionSource): Promise<Session> {
  const session = await getSession(source);

  if (!session) {
    throw new Error("Unauthorized");
  }

  return session;
}

export function applySessionCookie(
  response: NextResponse,
  payload: SessionPayload,
  now = new Date(),
): Session {
  const session = createSession(payload, now);

  response.cookies.set({
    name: COOKIE_NAME,
    value: encodeSession(session),
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: SESSION_DURATION_SECONDS,
    path: "/",
  });

  return session;
}

export function clearSessionCookie(response: NextResponse): void {
  response.cookies.set({
    name: COOKIE_NAME,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 0,
    path: "/",
  });
}

export function buildRequestCookieHeader(session: Session): string {
  return `${COOKIE_NAME}=${encodeSession(session)}`;
}

function readCookie(cookieHeader: string, name: string): string | undefined {
  const encodedName = `${name}=`;

  for (const part of cookieHeader.split(";")) {
    const trimmedPart = part.trim();

    if (trimmedPart.startsWith(encodedName)) {
      return trimmedPart.slice(encodedName.length);
    }
  }

  return undefined;
}

function decodeCookieValue(value: string): string {
  let decoded = value;

  for (let index = 0; index < 3; index += 1) {
    try {
      const nextValue = decodeURIComponent(decoded);

      if (nextValue === decoded) {
        break;
      }

      decoded = nextValue;
    } catch {
      break;
    }
  }

  return decoded;
}
