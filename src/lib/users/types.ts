export interface StoredUser {
  id: string | number;
  name: string;
  avatar_url: string;
  provider: "github" | "feishu";
  email?: string | null;
  login?: string;
  firstSeenAt: string;
  lastSeenAt: string;
}

export interface UserStore {
  users: StoredUser[];
}
