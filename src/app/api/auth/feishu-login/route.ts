import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { getFeishuOAuthUrl, getFeishuOAuthConfig } from "@/lib/auth/feishu";

export async function GET(): Promise<NextResponse> {
  const config = getFeishuOAuthConfig();

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
