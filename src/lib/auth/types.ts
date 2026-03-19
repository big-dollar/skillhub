export interface GitHubUser {
  id: number;
  login: string;
  name: string | null;
  avatar_url: string;
  email: string | null;
}

export interface FeishuUser {
  id: string;
  name: string;
  avatar_url: string;
  email: string | null;
  mobile: string | null;
}

export type User = GitHubUser | FeishuUser;

export interface Session {
  user: User;
  loggedInAt: string;
  provider: "github" | "feishu";
}

export interface SessionPayload {
  user: User;
  provider: "github" | "feishu";
}
