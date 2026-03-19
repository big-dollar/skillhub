import type { FeishuUser } from "@/lib/auth/types";

const FEISHU_OAUTH_URL = "https://open.feishu.cn/open-apis/authen/v1/index";
const FEISHU_TOKEN_URL = "https://open.feishu.cn/open-apis/authen/v1/access_token";
const FEISHU_USER_URL = "https://open.feishu.cn/open-apis/authen/v1/user_info";

export interface FeishuOAuthConfig {
  appId: string;
  appSecret: string;
  redirectUri: string;
}

export function getFeishuOAuthUrl(config: FeishuOAuthConfig, state: string): string {
  const params = new URLSearchParams({
    app_id: config.appId,
    redirect_uri: config.redirectUri,
    state,
  });

  return `${FEISHU_OAUTH_URL}?${params.toString()}`;
}

export async function exchangeFeishuCodeForToken(
  config: FeishuOAuthConfig,
  code: string,
): Promise<string | null> {
  try {
    const response = await fetch(FEISHU_TOKEN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        grant_type: "authorization_code",
        code,
      }),
    });

    if (!response.ok) {
      console.error("Feishu token exchange failed:", await response.text());
      return null;
    }

    const data = (await response.json()) as { 
      code: number; 
      msg: string;
      data?: { access_token?: string };
    };

    if (data.code !== 0 || !data.data?.access_token) {
      console.error("Feishu API error:", data.msg);
      return null;
    }

    return data.data.access_token;
  } catch (error) {
    console.error("Feishu token exchange error:", error);
    return null;
  }
}

export async function getFeishuUser(accessToken: string): Promise<FeishuUser | null> {
  try {
    const response = await fetch(FEISHU_USER_URL, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      console.error("Feishu user fetch failed:", await response.text());
      return null;
    }

    const result = (await response.json()) as {
      code: number;
      msg: string;
      data?: {
        user_id: string;
        name: string;
        avatar_url: string;
        email?: string;
        mobile?: string;
      };
    };

    if (result.code !== 0 || !result.data) {
      console.error("Feishu API error:", result.msg);
      return null;
    }

    const data = result.data;

    return {
      id: data.user_id,
      name: data.name,
      avatar_url: data.avatar_url,
      email: data.email ?? null,
      mobile: data.mobile ?? null,
    };
  } catch (error) {
    console.error("Feishu user fetch error:", error);
    return null;
  }
}

export function getFeishuOAuthConfig(): FeishuOAuthConfig | null {
  const appId = process.env.FEISHU_APP_ID;
  const appSecret = process.env.FEISHU_APP_SECRET;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  if (!appId || !appSecret) {
    return null;
  }

  return {
    appId,
    appSecret,
    redirectUri: `${appUrl}/api/auth/callback/feishu`,
  };
}
