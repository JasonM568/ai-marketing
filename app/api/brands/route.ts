import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { brands } from "@/lib/db/schema";
import { desc, eq, inArray } from "drizzle-orm";
import { getAuthUser, isAdmin, isSubscriber } from "@/lib/auth";
import { getAccessibleBrandIds } from "@/lib/brand-access";

// GET /api/brands — scoped by role via getAccessibleBrandIds
export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const accessibleIds = await getAccessibleBrandIds(user);

    let result: (typeof brands.$inferSelect)[];
    if (accessibleIds === null) {
      // Admin: all brands
      result = await db
        .select()
        .from(brands)
        .orderBy(desc(brands.createdAt));
    } else if (accessibleIds.length === 0) {
      result = [];
    } else {
      result = await db
        .select()
        .from(brands)
        .where(inArray(brands.id, accessibleIds))
        .orderBy(desc(brands.createdAt));
    }

    return NextResponse.json({ brands: result });
  } catch (error) {
    console.error("GET /api/brands error:", error);
    return NextResponse.json({ error: "取得品牌列表失敗" }, { status: 500 });
  }
}

// POST /api/brands — editors cannot create; subscriber has limit; admin/master can create freely
export async function POST(request: Request) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Editor cannot create brands
    if (user.role === "editor") {
      return NextResponse.json(
        { error: "權限不足：編輯者無法建立品牌" },
        { status: 403 }
      );
    }

    // Subscriber: check brand limit from plan
    if (isSubscriber(user)) {
      const ownBrands = await db
        .select({ id: brands.id })
        .from(brands)
        .where(eq(brands.createdBy, user.userId));

      // Get max brands from credits table
      const { userCredits } = await import("@/lib/db/schema");
      const [credits] = await db
        .select({ maxBrands: userCredits.maxBrands })
        .from(userCredits)
        .where(eq(userCredits.userId, user.userId))
        .limit(1);

      const maxBrands = credits?.maxBrands || 1;

      if (ownBrands.length >= maxBrands) {
        return NextResponse.json(
          { error: `您的方案最多可建立 ${maxBrands} 個品牌` },
          { status: 403 }
        );
      }
    }

    const body = await request.json();
    const {
      brandCode,
      name,
      industry = "",
      status = "draft",
      platforms = ["ig", "fb"],
    } = body;

    if (!brandCode || !name) {
      return NextResponse.json(
        { error: "品牌代碼和名稱為必填" },
        { status: 400 }
      );
    }

    if (!/^[a-z0-9_]+$/.test(brandCode)) {
      return NextResponse.json(
        { error: "品牌代碼只能包含英文小寫、數字和底線" },
        { status: 400 }
      );
    }

    const existing = await db
      .select({ id: brands.id })
      .from(brands)
      .where(eq(brands.brandCode, brandCode))
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json({ error: "品牌代碼已存在" }, { status: 409 });
    }

    const [newBrand] = await db
      .insert(brands)
      .values({ brandCode, name, industry, status, platforms, createdBy: user.userId })
      .returning();

    return NextResponse.json({ brand: newBrand }, { status: 201 });
  } catch (error) {
    console.error("POST /api/brands error:", error);
    return NextResponse.json({ error: "新增品牌失敗" }, { status: 500 });
  }
}
