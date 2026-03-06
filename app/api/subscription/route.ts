import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { subscriptions } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { getAuthUser } from "@/lib/auth";

// GET /api/subscription — 取得用戶訂閱狀態
export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "請先登入" }, { status: 401 });
    }

    const [subscription] = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, user.userId))
      .orderBy(desc(subscriptions.createdAt))
      .limit(1);

    if (!subscription) {
      return NextResponse.json({ subscription: null });
    }

    return NextResponse.json({
      subscription: {
        id: subscription.id,
        planId: subscription.planId,
        status: subscription.status,
        currentPeriodStart: subscription.currentPeriodStart,
        currentPeriodEnd: subscription.currentPeriodEnd,
        cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
        ecpayCardLast4: subscription.ecpayCardLast4,
        createdAt: subscription.createdAt,
      },
    });
  } catch (error) {
    console.error("GET /api/subscription error:", error);
    return NextResponse.json({ error: "查詢訂閱失敗" }, { status: 500 });
  }
}
