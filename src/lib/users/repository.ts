import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { StoredUser, UserStore } from "@/lib/users/types";
import type { User } from "@/lib/auth/types";

const EMPTY_STORE: UserStore = { users: [] };

export interface IUserRepository {
  list(): Promise<StoredUser[]>;
  getById(id: string | number): Promise<StoredUser | null>;
  searchByName(name: string): Promise<StoredUser[]>;
  saveOrUpdateUser(user: User, provider: "github" | "feishu"): Promise<StoredUser>;
}

export class UserRepository implements IUserRepository {
  private readonly rootDir: string;
  private readonly filePath: string;

  constructor(rootDir: string) {
    this.rootDir = path.isAbsolute(rootDir) ? rootDir : path.join(process.cwd(), rootDir);
    this.filePath = path.join(this.rootDir, "users.json");
  }

  async list(): Promise<StoredUser[]> {
    const store = await this.readStore();
    return store.users;
  }

  async getById(id: string | number): Promise<StoredUser | null> {
    const store = await this.readStore();
    return store.users.find((user) => user.id === id) ?? null;
  }

  async searchByName(name: string): Promise<StoredUser[]> {
    const store = await this.readStore();
    const normalizedQuery = name.trim().toLowerCase();
    
    if (!normalizedQuery) {
      return [];
    }

    return store.users.filter((user) => 
      user.name.toLowerCase().includes(normalizedQuery)
    );
  }

  async saveOrUpdateUser(user: User, provider: "github" | "feishu"): Promise<StoredUser> {
    const store = await this.readStore();
    const now = new Date().toISOString();
    
    const existingIndex = store.users.findIndex((u) => u.id === user.id);
    
    let storedUser: StoredUser;
    
    if (existingIndex >= 0) {
      // Update existing user
      storedUser = {
        ...store.users[existingIndex],
        name: "name" in user && user.name ? user.name : "login" in user ? user.login : user.name,
        avatar_url: user.avatar_url,
        lastSeenAt: now,
      };
      store.users[existingIndex] = storedUser;
    } else {
      // Create new user
      storedUser = {
        id: user.id,
        name: "name" in user && user.name ? user.name : "login" in user ? user.login : user.name,
        avatar_url: user.avatar_url,
        provider,
        email: "email" in user ? user.email : null,
        login: "login" in user ? user.login : undefined,
        firstSeenAt: now,
        lastSeenAt: now,
      };
      store.users.push(storedUser);
    }

    await this.writeStore(store);
    return storedUser;
  }

  private async writeStore(store: UserStore): Promise<void> {
    await mkdir(this.rootDir, { recursive: true });
    await writeFile(this.filePath, JSON.stringify(store, null, 2), "utf8");
  }

  private async readStore(): Promise<UserStore> {
    try {
      const raw = await readFile(this.filePath, "utf8");
      const parsed = JSON.parse(raw) as Partial<UserStore>;

      return {
        users: Array.isArray(parsed.users) ? parsed.users : EMPTY_STORE.users,
      };
    } catch (error) {
      if (isMissingFileError(error)) {
        return EMPTY_STORE;
      }

      throw error;
    }
  }
}

function isMissingFileError(error: unknown): error is NodeJS.ErrnoException {
  return typeof error === "object" && error !== null && "code" in error && error.code === "ENOENT";
}
