import { NextResponse } from "next/server";
import { applySessionCookie } from "@/lib/auth/session";
import type { GitHubUser } from "@/lib/auth/types";

const mockUser: GitHubUser = {
  id: 999999,
  login: "demo-user",
  name: "Demo User",
  avatar_url: "https://api.dicebear.com/9.x/initials/svg?seed=Demo",
  email: null,
};

export async function POST(): Promise<NextResponse> {
  const response = NextResponse.json({ success: true, user: mockUser });
  applySessionCookie(response, { user: mockUser });
  return response;
}
