export interface GitHubUser {
  id: number;
  login: string;
  name: string | null;
  avatar_url: string;
  email: string | null;
}

export interface Session {
  user: GitHubUser;
  loggedInAt: string;
}

export interface SessionPayload {
  user: GitHubUser;
}
