// 测试飞书 OAuth URL 生成
const FEISHU_OAUTH_URL = "https://open.feishu.cn/open-apis/authen/v1/index";

const config = {
  appId: "cli_a28ec35094ba500d",
  redirectUri: "http://localhost:3000/api/auth/callback/feishu",
};

const state = "test_state_123";

// 方法 1: URLSearchParams (自动编码)
const params1 = new URLSearchParams({
  app_id: config.appId,
  redirect_uri: config.redirectUri,
  state,
});
const url1 = `${FEISHU_OAUTH_URL}?${params1.toString()}`;

// 方法 2: 手动编码
const encodedAppId = encodeURIComponent(config.appId);
const encodedRedirectUri = encodeURIComponent(config.redirectUri);
const encodedState = encodeURIComponent(state);
const url2 = `${FEISHU_OAUTH_URL}?app_id=${encodedAppId}&redirect_uri=${encodedRedirectUri}&state=${encodedState}`;

console.log("=== 飞书 OAuth URL 测试 ===\n");
console.log("App ID:", config.appId);
console.log("Redirect URI:", config.redirectUri);
console.log("\n方法 1 (URLSearchParams):");
console.log(url1);
console.log("\n方法 2 (手动编码):");
console.log(url2);
console.log("\n两者是否相同:", url1 === url2);

// 解码检查
console.log("\n=== 解码检查 ===");
const url1Decoded = decodeURIComponent(url1);
const url2Decoded = decodeURIComponent(url2);
console.log("方法 1 解码:", url1Decoded);
console.log("方法 2 解码:", url2Decoded);

// 提取 redirect_uri 参数
console.log("\n=== 提取 redirect_uri 参数 ===");
const url1Params = new URL(url1).searchParams.get("redirect_uri");
const url2Params = url2.match(/redirect_uri=([^&]+)/)?.[1];
console.log("方法 1 redirect_uri:", url1Params);
console.log("方法 2 redirect_uri:", url2Params ? decodeURIComponent(url2Params) : "N/A");

// 预期值
console.log("\n=== 预期值 ===");
console.log("期望 redirect_uri:", config.redirectUri);
console.log("方法 1 匹配:", url1Params === config.redirectUri);
console.log("方法 2 匹配:", decodeURIComponent(url2Params || "") === config.redirectUri);
