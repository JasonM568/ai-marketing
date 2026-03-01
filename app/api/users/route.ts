import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { adminUsers } from "@/lib/db/schema";
import { desc } from "drizzle-orm";
import { getAuthUser, isAdmin } from "@/lib/auth";
import bcrypt from "bcryptjs";

// GET /api/users — admin only
export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user || !isAdmin(user)) {
      return NextResponse.json({ error: "權限不足" }, { status: 403 });
    }

    const users = await db
      .select({
        id: adminUsers.id,
        email: adminUsers.email,
        name: adminUsers.name,
        role: adminUsers.role,
        createdAt: adminUsers.createdAt,
      })
      .from(adminUsers)
      .orderBy(desc(adminUsers.createdAt));

    return NextResponse.json({ users });
  } catch (error) {
    console.error("GET /api/users error:", error);
    return NextResponse.json({ error: "取得用戶列表失敗" }, { status: 500 });
  }
}

// POST /api/users — admin only, create new user
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user || !isAdmin(user)) {
      return NextResponse.json({ error: "權限不足" }, { status: 403 });
    }

    const body = await request.json();
    const { email, password, name, role } = body;

    if (!email || !password) {
      return NextResponse.json({ error: "Email 和密碼為必填" }, { status: 400 });
    }

    if (!["admin", "editor", "subscriber"].includes(role)) {
      return NextResponse.json({ error: "無效的角色" }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "密碼至少 6 碼" }, { status: 400 });
    }

    // Check duplicate email
    const { eq } = await import("drizzle-orm");
    const existing = await db
      .select({ id: adminUsers.id })
      .from(adminUsers)
      .where(eq(adminUsers.email, email.toLowerCase().trim()))
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json({ error: "Email 已存在" }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const [newUser] = await db
      .insert(adminUsers)
      .values({
        email: email.toLowerCase().trim(),
        passwordHash,
        name: name || email.split("@")[0],
        role,
      })
      .returning({
        id: adminUsers.id,
        email: adminUsers.email,
        name: adminUsers.name,
        role: adminUsers.role,
        createdAt: adminUsers.createdAt,
      });

    return NextResponse.json({ user: newUser }, { status: 201 });
  } catch (error) {
    console.error("POST /api/users error:", error);
    return NextResponse.json({ error: "新增用戶失敗" }, { status: 500 });
  }
}
