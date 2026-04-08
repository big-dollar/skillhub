import { NextResponse } from "next/server";
import { getAppOrigin } from "@/lib/auth/app-origin";
import { applySessionCookie } from "@/lib/auth/session";
import { exchangeFeishuCodeForToken, getFeishuUser, getFeishuOAuthConfig } from "@/lib/auth/feishu";

export async function GET(request: Request): Promise<NextResponse> {
  const url = new URL(request.url);
  const appOrigin = getAppOrigin(request) ?? new URL(request.url).origin;
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
    return NextResponse.redirect(new URL("/upload?error=invalid_state", appOrigin));
  }

  // Handle Feishu OAuth errors
  if (error) {
    return NextResponse.redirect(new URL(`/upload?error=${error}`, appOrigin));
  }

  if (!code) {
    return NextResponse.redirect(new URL("/upload?error=no_code", appOrigin));
  }

  const config = getFeishuOAuthConfig(request);

  if (!config) {
    return NextResponse.redirect(new URL("/upload?error=not_configured", appOrigin));
  }

  // Exchange code for access token
  const accessToken = await exchangeFeishuCodeForToken(config, code);

  if (!accessToken) {
    return NextResponse.redirect(new URL("/upload?error=token_exchange_failed", appOrigin));
  }

  // Get Feishu user info
  const user = await getFeishuUser(accessToken);

  if (!user) {
    return NextResponse.redirect(new URL("/upload?error=user_fetch_failed", appOrigin));
  }

  // Create session
  const response = NextResponse.redirect(new URL("/upload", appOrigin));

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
  applySessionCookie(response, { user, provider: "feishu" });

  return response;
}
