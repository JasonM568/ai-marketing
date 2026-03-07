import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { socialAccounts } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getAuthUser } from "@/lib/auth";
import { canAccessBrand } from "@/lib/brand-access";

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "請先登入" }, { status: 401 });
    }

    const brandId = request.nextUrl.searchParams.get("brandId");
    if (!brandId) {
      return NextResponse.json({ error: "缺少 brandId" }, { status: 400 });
    }

    // Check brand access
    const hasAccess = await canAccessBrand(user, brandId);
    if (!hasAccess) {
      return NextResponse.json({ error: "權限不足" }, { status: 403 });
    }

    const accounts = await db
      .select({
        id: socialAccounts.id,
        platform: socialAccounts.platform,
        platformUsername: socialAccounts.platformUsername,
        platformUserId: socialAccounts.platformUserId,
        pageId: socialAccounts.pageId,
        tokenExpiresAt: socialAccounts.tokenExpiresAt,
        status: socialAccounts.status,
        createdAt: socialAccounts.createdAt,
      })
      .from(socialAccounts)
      .where(eq(socialAccounts.brandId, brandId));

    return NextResponse.json(accounts);
  } catch (error) {
    console.error("List social accounts error:", error);
    return NextResponse.json({ error: "查詢失敗" }, { status: 500 });
  }
}
