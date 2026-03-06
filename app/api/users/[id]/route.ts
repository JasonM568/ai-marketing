import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { adminUsers } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getAuthUser, isAdmin } from "@/lib/auth";
import bcrypt from "bcryptjs";

// PUT /api/users/[id] — admin only, edit user
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser();
    if (!user || !isAdmin(user)) {
      return NextResponse.json({ error: "權限不足" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { name, role, password } = body;

    // Prevent admin from demoting themselves
    if (id === user.userId && role && role !== "admin") {
      return NextResponse.json({ error: "不能更改自己的管理員角色" }, { status: 400 });
    }

    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name;
    if (role !== undefined) {
      if (!["admin", "editor", "subscriber"].includes(role)) {
        return NextResponse.json({ error: "無效的角色" }, { status: 400 });
      }
      updateData.role = role;
    }
    if (password) {
      if (password.length < 6) {
        return NextResponse.json({ error: "密碼至少 6 碼" }, { status: 400 });
      }
      updateData.passwordHash = await bcrypt.hash(password, 10);
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "沒有要更新的欄位" }, { status: 400 });
    }

    const [updated] = await db
      .update(adminUsers)
      .set(updateData)
      .where(eq(adminUsers.id, id))
      .returning({
        id: adminUsers.id,
        email: adminUsers.email,
        name: adminUsers.name,
        role: adminUsers.role,
        createdAt: adminUsers.createdAt,
      });

    if (!updated) {
      return NextResponse.json({ error: "用戶不存在" }, { status: 404 });
    }

    return NextResponse.json({ user: updated });
  } catch (error) {
    console.error("PUT /api/users/[id] error:", error);
    return NextResponse.json({ error: "更新用戶失敗" }, { status: 500 });
  }
}

// DELETE /api/users/[id] — admin only
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser();
    if (!user || !isAdmin(user)) {
      return NextResponse.json({ error: "權限不足" }, { status: 403 });
    }

    const { id } = await params;

    // Prevent self-deletion
    if (id === user.userId) {
      return NextResponse.json({ error: "不能刪除自己的帳號" }, { status: 400 });
    }

    const [deleted] = await db
      .delete(adminUsers)
      .where(eq(adminUsers.id, id))
      .returning({ id: adminUsers.id, email: adminUsers.email });

    if (!deleted) {
      return NextResponse.json({ error: "用戶不存在" }, { status: 404 });
    }

    return NextResponse.json({ message: `已刪除用戶: ${deleted.email}` });
  } catch (error) {
    console.error("DELETE /api/users/[id] error:", error);
    return NextResponse.json({ error: "刪除用戶失敗" }, { status: 500 });
  }
}
