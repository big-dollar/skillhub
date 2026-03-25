import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/session";
import { requireAdmin } from "@/lib/admin/auth";
import { UserRepository } from "@/lib/users/repository";

// GET /api/admin/users - 获取所有用户（管理员）
export async function GET(request: Request): Promise<NextResponse> {
  try {
    const session = await requireSession(request);
    requireAdmin(session.user);

    const userRepo = new UserRepository(process.env.DATA_DIR ?? "data");
    const users = await userRepo.list();

    return NextResponse.json({ success: true, users });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json(
        { success: false, error: "请先登录" },
        { status: 401 }
      );
    }

    if (error instanceof Error && error.message.includes("Forbidden")) {
      return NextResponse.json(
        { success: false, error: "需要管理员权限" },
        { status: 403 }
      );
    }

    console.error("Failed to get all users:", error);
    return NextResponse.json(
      { success: false, error: "获取用户列表失败" },
      { status: 500 }
    );
  }
}
