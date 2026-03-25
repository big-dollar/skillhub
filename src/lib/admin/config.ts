// 管理员配置
// 可以通过环境变量或硬编码配置管理员列表

export interface AdminConfig {
  // GitHub 用户 ID 列表
  githubAdminIds: number[];
  // GitHub 用户名列表
  githubAdminLogins: string[];
  // 飞书用户 ID 列表
  feishuAdminIds: string[];
}

// 从环境变量读取管理员配置
// 格式: GITHUB_ADMIN_IDS=123456,789012;GITHUB_ADMIN_LOGINS=admin1,admin2
export function getAdminConfig(): AdminConfig {
  const githubIds = process.env.GITHUB_ADMIN_IDS?.split(",").map((id) => parseInt(id.trim(), 10)).filter((id) => !isNaN(id)) ?? [];
  const githubLogins = process.env.GITHUB_ADMIN_LOGINS?.split(",").map((login) => login.trim()).filter((login) => login.length > 0) ?? [];
  const feishuIds = process.env.FEISHU_ADMIN_IDS?.split(",").map((id) => id.trim()).filter((id) => id.length > 0) ?? [];

  return {
    githubAdminIds: githubIds,
    githubAdminLogins: githubLogins,
    feishuAdminIds: feishuIds,
  };
}

// 默认管理员配置（开发环境使用）
export const DEFAULT_ADMIN_CONFIG: AdminConfig = {
  githubAdminIds: [],
  githubAdminLogins: [], // 添加默认管理员
  feishuAdminIds: [], // 飞书用户 ID 是字符串，需要用引号包裹
};
