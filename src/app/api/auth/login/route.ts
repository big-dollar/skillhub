import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { getGitHubOAuthUrl, getOAuthConfig } from "@/lib/auth/github";

export async function GET(): Promise<NextResponse> {
  const config = getOAuthConfig();

  if (!config) {
    return NextResponse.json(
      { success: false, error: "GitHub OAuth 未配置" },
      { status: 500 },
    );
  }

  // Generate state for CSRF protection
  const state = randomBytes(32).toString("hex");

  // Store state in cookie (short-lived, 10 minutes)
  const oauthUrl = getGitHubOAuthUrl(config, state);

  const response = NextResponse.redirect(oauthUrl);
  response.cookies.set({
    name: "oauth-state",
    value: state,
    httpOnly: true,
    sameSite: "lax",
    secure: false, // localhost 不支持 secure
    maxAge: 60 * 10, // 10 minutes
    path: "/",
  });

  return response;
}
