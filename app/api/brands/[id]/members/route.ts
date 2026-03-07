import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { brandMembers, adminUsers } from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { getAuthUser, isAdminOrMaster } from "@/lib/auth";
import { canAccessBrand } from "@/lib/brand-access";

// GET /api/brands/[id]/members — list members (anyone who can access the brand)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: brandId } = await params;

    // Check brand access
    const hasAccess = await canAccessBrand(user, brandId);
    if (!hasAccess) {
      return NextResponse.json({ error: "權限不足" }, { status: 403 });
    }

    const members = await db
      .select({
        id: brandMembers.id,
        brandId: brandMembers.brandId,
        userId: brandMembers.userId,
        role: brandMembers.role,
        assignedBy: brandMembers.assignedBy,
        createdAt: brandMembers.createdAt,
        userName: adminUsers.name,
        userEmail: adminUsers.email,
        userRole: adminUsers.role,
      })
      .from(brandMembers)
      .innerJoin(adminUsers, eq(brandMembers.userId, adminUsers.id))
      .where(eq(brandMembers.brandId, brandId));

    return NextResponse.json({ members });
  } catch (error) {
    console.error("GET /api/brands/[id]/members error:", error);
    return NextResponse.json({ error: "取得成員列表失敗" }, { status: 500 });
  }
}

// POST /api/brands/[id]/members — add member (Admin/Master only, can only assign editor/master users)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser();
    if (!user || !isAdminOrMaster(user)) {
      return NextResponse.json({ error: "權限不足" }, { status: 403 });
    }

    const { id: brandId } = await params;
    const body = await request.json();
    const { userId, role = "member" } = body;

    if (!userId) {
      return NextResponse.json({ error: "缺少 userId" }, { status: 400 });
    }

    // Validate target user exists and is editor or master
    const [targetUser] = await db
      .select({ id: adminUsers.id, role: adminUsers.role })
      .from(adminUsers)
      .where(eq(adminUsers.id, userId))
      .limit(1);

    if (!targetUser) {
      return NextResponse.json({ error: "用戶不存在" }, { status: 404 });
    }

    if (targetUser.role !== "editor" && targetUser.role !== "master") {
      return NextResponse.json(
        { error: "只能指派 editor 或 master 角色的用戶" },
        { status: 400 }
      );
    }

    // If role="manager", check no existing manager for this brand
    if (role === "manager") {
      const [existingManager] = await db
        .select({ id: brandMembers.id })
        .from(brandMembers)
        .where(
          and(
            eq(brandMembers.brandId, brandId),
            eq(brandMembers.role, "manager")
          )
        )
        .limit(1);

      if (existingManager) {
        return NextResponse.json(
          { error: "此品牌已有管理者，請先移除現有管理者" },
          { status: 409 }
        );
      }
    }

    // Upsert: if already a member, update role
    const [existing] = await db
      .select({ id: brandMembers.id })
      .from(brandMembers)
      .where(
        and(
          eq(brandMembers.brandId, brandId),
          eq(brandMembers.userId, userId)
        )
      )
      .limit(1);

    let member;
    if (existing) {
      [member] = await db
        .update(brandMembers)
        .set({ role, assignedBy: user.userId })
        .where(eq(brandMembers.id, existing.id))
        .returning();
    } else {
      [member] = await db
        .insert(brandMembers)
        .values({
          brandId,
          userId,
          role,
          assignedBy: user.userId,
        })
        .returning();
    }

    return NextResponse.json({ member }, { status: existing ? 200 : 201 });
  } catch (error) {
    console.error("POST /api/brands/[id]/members error:", error);
    return NextResponse.json({ error: "新增成員失敗" }, { status: 500 });
  }
}

// DELETE /api/brands/[id]/members — remove member (Admin/Master only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser();
    if (!user || !isAdminOrMaster(user)) {
      return NextResponse.json({ error: "權限不足" }, { status: 403 });
    }

    const { id: brandId } = await params;
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json({ error: "缺少 userId" }, { status: 400 });
    }

    const [deleted] = await db
      .delete(brandMembers)
      .where(
        and(
          eq(brandMembers.brandId, brandId),
          eq(brandMembers.userId, userId)
        )
      )
      .returning();

    if (!deleted) {
      return NextResponse.json({ error: "成員不存在" }, { status: 404 });
    }

    return NextResponse.json({ message: "已移除成員" });
  } catch (error) {
    console.error("DELETE /api/brands/[id]/members error:", error);
    return NextResponse.json({ error: "移除成員失敗" }, { status: 500 });
  }
}
