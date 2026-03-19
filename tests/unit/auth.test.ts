import { describe, expect, it } from "vitest";
import { NextResponse } from "next/server";
import {
  COOKIE_NAME,
  applySessionCookie,
  buildRequestCookieHeader,
  clearSessionCookie,
  createSession,
  decodeSession,
  getSession,
  requireSession,
} from "@/lib/auth/session";
import type { GitHubUser } from "@/lib/auth/types";

const mockUser: GitHubUser = {
  id: 123456,
  login: "demo-user",
  name: "Demo User",
  avatar_url: "https://avatars.githubusercontent.com/u/123456?v=4",
  email: "demo@example.com",
};

describe("auth session helpers", () => {
  it("reads a session from a request cookie header", async () => {
    const session = createSession({ user: mockUser }, new Date("2026-03-18T00:00:00.000Z"));
    const request = new Request("http://localhost", {
      headers: { cookie: buildRequestCookieHeader(session) },
    });

    await expect(getSession(request)).resolves.toEqual(session);
  });

  it("returns null for an invalid cookie", async () => {
    const request = new Request("http://localhost", {
      headers: { cookie: `${COOKIE_NAME}=not-json` },
    });

    await expect(getSession(request)).resolves.toBeNull();
    expect(decodeSession("not-json")).toBeNull();
  });

  it("decodes browser-style double-encoded cookies", async () => {
    const session = createSession({ user: mockUser }, new Date("2026-03-18T00:00:00.000Z"));
    const request = new Request("http://localhost", {
      headers: { cookie: `${COOKIE_NAME}=${encodeURIComponent(buildRequestCookieHeader(session).split("=")[1] ?? "")}` },
    });

    await expect(getSession(request)).resolves.toEqual(session);
  });

  it("applies and clears the session cookie on responses", () => {
    const response = NextResponse.json({ success: true });
    applySessionCookie(response, { user: mockUser }, new Date("2026-03-18T00:00:00.000Z"));

    expect(response.headers.get("set-cookie")).toContain(`${COOKIE_NAME}=`);
    expect(response.headers.get("set-cookie")).toContain("HttpOnly");

    const cleared = NextResponse.json({ success: true });
    clearSessionCookie(cleared);
    expect(cleared.headers.get("set-cookie")).toContain("Max-Age=0");
  });

  it("throws when session is required but missing", async () => {
    await expect(requireSession(new Request("http://localhost"))).rejects.toThrow("Unauthorized");
  });
});
