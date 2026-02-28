import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { brands } from "@/lib/db/schema";
import { requireAuth } from "@/lib/auth";
import { eq, ilike, or, desc } from "drizzle-orm";

// GET /api/brands — 取得品牌列表
export async function GET() {
  try {
    await requireAuth();

    const result = await db.select().from(brands).orderBy(desc(brands.createdAt));

    return NextResponse.json({ brands: result });
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "未授權" }, { status: 401 });
    }
    console.error("GET /api/brands error:", error);
    return NextResponse.json({ error: "取得品牌列表失敗" }, { status: 500 });
  }
}

// POST /api/brands — 新增品牌
export async function POST(request: Request) {
  try {
    const session = await requireAuth();
    const body = await request.json();

    const {
      brandCode,
      name,
      industry = "",
      status = "draft",
      platforms = ["ig", "fb"],
    } = body;

    if (!brandCode || !name) {
      return NextResponse.json({ error: "品牌代碼和名稱為必填" }, { status: 400 });
    }

    if (!/^[a-z0-9_]+$/.test(brandCode)) {
      return NextResponse.json(
        { error: "品牌代碼只能包含英文小寫、數字和底線" },
        { status: 400 }
      );
    }

    // 檢查重複
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
      .values({
        brandCode,
        name,
        industry,
        status,
        platforms,
      })
      .returning();

    return NextResponse.json({ brand: newBrand }, { status: 201 });
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "未授權" }, { status: 401 });
    }
    console.error("POST /api/brands error:", error);
    return NextResponse.json({ error: "新增品牌失敗" }, { status: 500 });
  }
}
