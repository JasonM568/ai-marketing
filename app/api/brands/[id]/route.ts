import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { brands } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getAuthUser, isAdmin } from "@/lib/auth";

// GET /api/brands/[id] — everyone can view
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const isUUID =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        id
      );

    const [brand] = await db
      .select()
      .from(brands)
      .where(isUUID ? eq(brands.id, id) : eq(brands.brandCode, id))
      .limit(1);

    if (!brand) {
      return NextResponse.json({ error: "品牌不存在" }, { status: 404 });
    }

    return NextResponse.json({ brand });
  } catch (error) {
    console.error("GET /api/brands/[id] error:", error);
    return NextResponse.json({ error: "取得品牌失敗" }, { status: 500 });
  }
}

// PUT /api/brands/[id] — admin + editor
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

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

    // Map camelCase to snake_case for DB
    const fieldMap: Record<string, string> = {
      name: "name",
      industry: "industry",
      status: "status",
      brandVoice: "brand_voice",
      icp: "icp",
      services: "services",
      contentPillars: "content_pillars",
      pastHits: "past_hits",
      brandStory: "brand_story",
      platforms: "platforms",
      adConfig: "ad_config",
      crmConfig: "crm_config",
    };

    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        // Use Drizzle column reference
        updateData[field] = body[field];
      }
    }

    // Also support snake_case input from older API format
    const snakeFields = [
      "brand_voice",
      "icp",
      "services",
      "content_pillars",
      "past_hits",
      "brand_story",
      "platforms",
      "ad_config",
      "crm_config",
    ];
    const snakeToCamel: Record<string, string> = {
      brand_voice: "brandVoice",
      content_pillars: "contentPillars",
      past_hits: "pastHits",
      brand_story: "brandStory",
      ad_config: "adConfig",
      crm_config: "crmConfig",
    };

    for (const sf of snakeFields) {
      if (body[sf] !== undefined) {
        const camelKey = snakeToCamel[sf] || sf;
        updateData[camelKey] = body[sf];
      }
    }

    const [updated] = await db
      .update(brands)
      .set(updateData)
      .where(eq(brands.id, id))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: "品牌不存在" }, { status: 404 });
    }

    return NextResponse.json({ brand: updated });
  } catch (error) {
    console.error("PUT /api/brands/[id] error:", error);
    return NextResponse.json({ error: "更新品牌失敗" }, { status: 500 });
  }
}

// DELETE /api/brands/[id] — admin only
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!isAdmin(user)) {
      return NextResponse.json(
        { error: "權限不足：僅管理員可刪除品牌" },
        { status: 403 }
      );
    }

    const { id } = await params;

    const [deleted] = await db
      .delete(brands)
      .where(eq(brands.id, id))
      .returning();

    if (!deleted) {
      return NextResponse.json({ error: "品牌不存在" }, { status: 404 });
    }

    return NextResponse.json({ message: `已刪除品牌: ${deleted.name}` });
  } catch (error) {
    console.error("DELETE /api/brands/[id] error:", error);
    return NextResponse.json({ error: "刪除品牌失敗" }, { status: 500 });
  }
}
