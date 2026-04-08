import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { getFeishuOAuthUrl, getFeishuOAuthConfig } from "@/lib/auth/feishu";

export async function GET(request: Request): Promise<NextResponse> {
  const config = getFeishuOAuthConfig(request);

  if (!config) {
    return NextResponse.json(
      { success: false, error: "飞书 OAuth 未配置" },
      { status: 500 },
    );
  }

  // Generate state for CSRF protection
  const state = randomBytes(32).toString("hex");

  // Store state in cookie (short-lived, 10 minutes)
  const oauthUrl = getFeishuOAuthUrl(config, state);
  
  // Debug: log the generated OAuth URL
  console.log("[Feishu OAuth] Generated URL:", oauthUrl);
  console.log("[Feishu OAuth] Redirect URI:", config.redirectUri);

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
