import { NextResponse } from "next/server";
import { getAppOrigin } from "@/lib/auth/app-origin";
import { clearSessionCookie } from "@/lib/auth/session";

export async function POST(): Promise<NextResponse> {
  const response = NextResponse.json({ success: true });
  clearSessionCookie(response);
  return response;
}

export async function GET(request: Request): Promise<NextResponse> {
  const response = NextResponse.redirect(new URL("/", getAppOrigin(request) ?? request.url));
  clearSessionCookie(response);
  return response;
}
