import type { FeishuUser } from "@/lib/auth/types";
import { getAppOrigin } from "@/lib/auth/app-origin";

const FEISHU_OAUTH_URL = "https://open.feishu.cn/open-apis/authen/v1/index";
const FEISHU_TOKEN_URL = "https://open.feishu.cn/open-apis/authen/v1/access_token";
const FEISHU_USER_URL = "https://open.feishu.cn/open-apis/authen/v1/user_info";

export interface FeishuOAuthConfig {
  appId: string;
  appSecret: string;
  redirectUri: string;
}

// 获取飞书 app_access_token
async function getAppAccessToken(appId: string, appSecret: string): Promise<string | null> {
  try {
    const response = await fetch("https://open.feishu.cn/open-apis/auth/v3/app_access_token/internal", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        app_id: appId,
        app_secret: appSecret,
      }),
    });

    if (!response.ok) {
      console.error("Feishu app_access_token failed:", await response.text());
      return null;
    }

    const data = (await response.json()) as {
      code: number;
      msg: string;
      app_access_token?: string;
    };

    if (data.code !== 0 || !data.app_access_token) {
      console.error("Feishu app_access_token error:", data.msg);
      return null;
    }

    return data.app_access_token;
  } catch (error) {
    console.error("Feishu app_access_token error:", error);
    return null;
  }
}

export function getFeishuOAuthUrl(config: FeishuOAuthConfig, state: string): string {
  // 手动构建 URL，确保 redirect_uri 不被双重编码
  const encodedAppId = encodeURIComponent(config.appId);
  const encodedRedirectUri = encodeURIComponent(config.redirectUri);
  const encodedState = encodeURIComponent(state);
  
  return `${FEISHU_OAUTH_URL}?app_id=${encodedAppId}&redirect_uri=${encodedRedirectUri}&state=${encodedState}`;
}

export async function exchangeFeishuCodeForToken(
  config: FeishuOAuthConfig,
  code: string,
): Promise<string | null> {
  try {
    // 首先获取 app_access_token
    const appAccessToken = await getAppAccessToken(config.appId, config.appSecret);
    if (!appAccessToken) {
      console.error("Failed to get app_access_token");
      return null;
    }

    const response = await fetch(FEISHU_TOKEN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${appAccessToken}`,
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

export function getFeishuOAuthConfig(request?: Request): FeishuOAuthConfig | null {
  const appId = process.env.FEISHU_APP_ID;
  const appSecret = process.env.FEISHU_APP_SECRET;
  const appOrigin = getAppOrigin(request);

  if (!appId || !appSecret || !appOrigin) {
    return null;
  }

  return {
    appId,
    appSecret,
    redirectUri: `${appOrigin}/api/auth/callback/feishu`,
  };
}
