import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { adminUsers } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";
import { getAuthUser, isAdmin, isMaster, isAdminOrMaster } from "@/lib/auth";
import bcrypt from "bcryptjs";

// GET /api/users — admin sees all, master sees only subscribers
export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user || !isAdminOrMaster(user)) {
      return NextResponse.json({ error: "權限不足" }, { status: 403 });
    }

    let query = db
      .select({
        id: adminUsers.id,
        email: adminUsers.email,
        name: adminUsers.name,
        role: adminUsers.role,
        createdAt: adminUsers.createdAt,
      })
      .from(adminUsers)
      .orderBy(desc(adminUsers.createdAt))
      .$dynamic();

    // Master: only sees subscribers
    if (isMaster(user)) {
      query = query.where(eq(adminUsers.role, "subscriber"));
    }

    const users = await query;

    return NextResponse.json({ users });
  } catch (error) {
    console.error("GET /api/users error:", error);
    return NextResponse.json({ error: "取得用戶列表失敗" }, { status: 500 });
  }
}

// POST /api/users — admin/master can create. Master can only create subscriber accounts.
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user || !isAdminOrMaster(user)) {
      return NextResponse.json({ error: "權限不足" }, { status: 403 });
    }

    const body = await request.json();
    const { email, password, name, role } = body;

    if (!email || !password) {
      return NextResponse.json({ error: "Email 和密碼為必填" }, { status: 400 });
    }

    // Admin can create admin/master/editor/subscriber; Master can only create subscriber
    const validRolesForAdmin = ["admin", "master", "editor", "subscriber"];
    const validRolesForMaster = ["subscriber"];

    const allowedRoles = isAdmin(user) ? validRolesForAdmin : validRolesForMaster;

    if (!allowedRoles.includes(role)) {
      if (isMaster(user)) {
        return NextResponse.json({ error: "Master 只能建立 subscriber 帳號" }, { status: 403 });
      }
      return NextResponse.json({ error: "無效的角色" }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "密碼至少 6 碼" }, { status: 400 });
    }

    // Check duplicate email
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
