import type { User } from "@/lib/auth/types";
import { getAdminConfig, DEFAULT_ADMIN_CONFIG } from "@/lib/admin/config";

/**
 * 检查用户是否为管理员
 */
export function isAdmin(user: User): boolean {
  const envConfig = getAdminConfig();

  // 检查 GitHub 用户
  if ("login" in user) {
    // 优先检查环境变量配置，如果没有则使用默认配置
    const adminIds = envConfig.githubAdminIds.length > 0 ? envConfig.githubAdminIds : DEFAULT_ADMIN_CONFIG.githubAdminIds;
    const adminLogins = envConfig.githubAdminLogins.length > 0 ? envConfig.githubAdminLogins : DEFAULT_ADMIN_CONFIG.githubAdminLogins;
    
    // 检查用户 ID
    if (adminIds.includes(user.id)) {
      return true;
    }
    // 检查用户名
    if (adminLogins.includes(user.login)) {
      return true;
    }
    return false;
  }

  // 检查飞书用户
  const feishuAdminIds = envConfig.feishuAdminIds.length > 0 ? envConfig.feishuAdminIds : DEFAULT_ADMIN_CONFIG.feishuAdminIds;
  if (feishuAdminIds.includes(user.id)) {
    return true;
  }

  return false;
}

/**
 * 要求用户是管理员，否则抛出错误
 */
export function requireAdmin(user: User): void {
  if (!isAdmin(user)) {
    throw new Error("Forbidden: Admin access required");
  }
}
