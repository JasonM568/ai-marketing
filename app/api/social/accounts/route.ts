import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { socialAccounts, brands } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { getAuthUser, isSubscriber } from "@/lib/auth";

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

    // Subscriber ownership check
    if (isSubscriber(user)) {
      const [brand] = await db.select().from(brands).where(and(eq(brands.id, brandId), eq(brands.createdBy, user.userId)));
      if (!brand) {
        return NextResponse.json({ error: "無權限" }, { status: 403 });
      }
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
