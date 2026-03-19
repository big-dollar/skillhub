import { NextResponse } from "next/server";
import { clearSessionCookie } from "@/lib/auth/session";

export async function POST(): Promise<NextResponse> {
  const response = NextResponse.json({ success: true });
  clearSessionCookie(response);
  return response;
}

export async function GET(): Promise<NextResponse> {
  const response = NextResponse.redirect(new URL("/", process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"));
  clearSessionCookie(response);
  return response;
}
