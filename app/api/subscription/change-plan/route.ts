import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { subscriptions } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { getAuthUser } from "@/lib/auth";
import { PLANS } from "@/lib/plans";

// POST /api/subscription/change-plan — 升降級方案（下期生效）
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "請先登入" }, { status: 401 });
    }

    const body = await request.json();
    const { newPlanId } = body;

    const newPlan = PLANS[newPlanId];
    if (!newPlan) {
      return NextResponse.json({ error: "無效的方案" }, { status: 400 });
    }

    const [subscription] = await db
      .select()
      .from(subscriptions)
      .where(
        and(
          eq(subscriptions.userId, user.userId),
          eq(subscriptions.status, "active")
        )
      )
      .limit(1);

    if (!subscription) {
      return NextResponse.json({ error: "找不到有效訂閱" }, { status: 404 });
    }

    if (subscription.planId === newPlanId) {
      return NextResponse.json({ error: "已是該方案" }, { status: 400 });
    }

    // Update plan — takes effect on next billing cycle
    await db
      .update(subscriptions)
      .set({
        planId: newPlanId,
        cancelAtPeriodEnd: false, // Resume if was cancelling
        cancelledAt: null,
        updatedAt: new Date(),
      })
      .where(eq(subscriptions.id, subscription.id));

    return NextResponse.json({
      success: true,
      message: `方案已變更為 ${newPlan.name}，下次扣款時生效`,
      newPlanId,
      effectiveDate: subscription.currentPeriodEnd,
    });
  } catch (error) {
    console.error("Change plan error:", error);
    return NextResponse.json({ error: "方案變更失敗" }, { status: 500 });
  }
}
