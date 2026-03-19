import { NextResponse } from "next/server";
import { applySessionCookie } from "@/lib/auth/session";
import { exchangeCodeForToken, getGitHubUser, getOAuthConfig } from "@/lib/auth/github";

export async function GET(request: Request): Promise<NextResponse> {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");

  // Get stored state from cookie
  const cookieHeader = request.headers.get("cookie") ?? "";
  const storedState = cookieHeader
    .split(";")
    .find((c) => c.trim().startsWith("oauth-state="))
    ?.split("=")
    ?.slice(1)
    .join("=");

  // Validate state to prevent CSRF
  if (!state || state !== storedState) {
    return NextResponse.redirect(new URL("/upload?error=invalid_state", request.url));
  }

  // Handle GitHub OAuth errors
  if (error) {
    return NextResponse.redirect(new URL(`/upload?error=${error}`, request.url));
  }

  if (!code) {
    return NextResponse.redirect(new URL("/upload?error=no_code", request.url));
  }

  const config = getOAuthConfig();

  if (!config) {
    return NextResponse.redirect(new URL("/upload?error=not_configured", request.url));
  }

  // Exchange code for access token
  const accessToken = await exchangeCodeForToken(config, code);

  if (!accessToken) {
    return NextResponse.redirect(new URL("/upload?error=token_exchange_failed", request.url));
  }

  // Get GitHub user info
  const user = await getGitHubUser(accessToken);

  if (!user) {
    return NextResponse.redirect(new URL("/upload?error=user_fetch_failed", request.url));
  }

  // Create session
  const response = NextResponse.redirect(new URL("/upload", request.url));

  // Clear oauth state cookie
  response.cookies.set({
    name: "oauth-state",
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 0,
    path: "/",
  });

  // Apply session cookie
  applySessionCookie(response, { user });

  return response;
}
