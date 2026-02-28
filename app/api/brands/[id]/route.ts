import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { brands } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { requireAuth } from "@/lib/auth";

// GET /api/brands/[id]
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth();
    const { id } = await params;

    const [brand] = await db
      .select()
      .from(brands)
      .where(eq(brands.id, id))
      .limit(1);

    if (!brand) {
      return NextResponse.json({ error: "品牌不存在" }, { status: 404 });
    }

    return NextResponse.json({ brand });
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "未授權" }, { status: 401 });
    }
    console.error("GET /api/brands/[id] error:", error);
    return NextResponse.json({ error: "取得品牌失敗" }, { status: 500 });
  }
}

// PUT /api/brands/[id]
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth();
    const { id } = await params;
    const body = await request.json();

    // 建立更新物件（只更新有傳入的欄位）
    const updates: Record<string, unknown> = {};
    const allowedFields = [
      "name",
      "industry",
      "status",
      "brandVoice",
      "icp",
      "services",
      "contentPillars",
      "pastHits",
      "brandStory",
      "platforms",
      "adConfig",
      "crmConfig",
    ];

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updates[field] = body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "沒有要更新的欄位" }, { status: 400 });
    }

    // 手動更新 updatedAt
    updates.updatedAt = new Date();

    const [updated] = await db
      .update(brands)
      .set(updates)
      .where(eq(brands.id, id))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: "品牌不存在" }, { status: 404 });
    }

    return NextResponse.json({ brand: updated });
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "未授權" }, { status: 401 });
    }
    console.error("PUT /api/brands/[id] error:", error);
    return NextResponse.json({ error: "更新品牌失敗" }, { status: 500 });
  }
}

// DELETE /api/brands/[id]
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth();
    const { id } = await params;

    const [deleted] = await db
      .delete(brands)
      .where(eq(brands.id, id))
      .returning({ id: brands.id, name: brands.name });

    if (!deleted) {
      return NextResponse.json({ error: "品牌不存在" }, { status: 404 });
    }

    return NextResponse.json({ message: `已刪除品牌: ${deleted.name}` });
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "未授權" }, { status: 401 });
    }
    console.error("DELETE /api/brands/[id] error:", error);
    return NextResponse.json({ error: "刪除品牌失敗" }, { status: 500 });
  }
}
