import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/session";
import { UserRepository } from "@/lib/users/repository";

export async function GET(request: Request): Promise<NextResponse> {
  try {
    await requireSession(request);
    
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");

    if (!query || typeof query !== "string") {
      return NextResponse.json(
        { success: false, error: "缺少搜索关键词" },
        { status: 400 }
      );
    }

    const userRepo = new UserRepository(process.env.DATA_DIR ?? "data");
    const users = await userRepo.searchByName(query);

    return NextResponse.json({ success: true, users });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json(
        { success: false, error: "请先登录" },
        { status: 401 }
      );
    }

    console.error("Failed to search users:", error);
    return NextResponse.json(
      { success: false, error: "搜索用户失败" },
      { status: 500 }
    );
  }
}
