import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { subscriptions, paymentRecords } from "@/lib/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import { getAuthUser } from "@/lib/auth";
import { PLANS } from "@/lib/plans";
import {
  generateMerchantTradeNo,
  buildPeriodicPaymentParams,
  getEcpayFormHtml,
} from "@/lib/ecpay";

// POST /api/subscription/checkout — 建立訂閱，產生 ECPay 表單
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "請先登入" }, { status: 401 });
    }

    const body = await request.json();
    const { planId } = body;

    const plan = PLANS[planId];
    if (!plan) {
      return NextResponse.json({ error: "無效的方案" }, { status: 400 });
    }

    // Check for active subscription
    const [existingSub] = await db
      .select()
      .from(subscriptions)
      .where(
        and(
          eq(subscriptions.userId, user.userId),
          inArray(subscriptions.status, ["active", "pending"])
        )
      )
      .limit(1);

    if (existingSub && existingSub.status === "active") {
      return NextResponse.json({ error: "您已有有效訂閱，請先取消後再訂閱新方案" }, { status: 400 });
    }

    const merchantTradeNo = generateMerchantTradeNo();
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || request.nextUrl.origin;

    // Create subscription record
    const [subscription] = await db
      .insert(subscriptions)
      .values({
        userId: user.userId,
        planId,
        status: "pending",
        ecpayMerchantTradeNo: merchantTradeNo,
        ecpayPeriodType: "M",
      })
      .returning();

    // Create initial payment record
    await db.insert(paymentRecords).values({
      subscriptionId: subscription.id,
      userId: user.userId,
      ecpayMerchantTradeNo: merchantTradeNo,
      planId,
      amount: plan.price,
      status: "pending",
      paymentType: "initial",
    });

    // Build ECPay form
    const params = buildPeriodicPaymentParams({
      merchantTradeNo,
      planName: `AI Marketing Agent - ${plan.name}`,
      amount: plan.price,
      returnUrl: `${baseUrl}/api/subscription/callback`,
      periodReturnUrl: `${baseUrl}/api/subscription/period-notify`,
      clientBackUrl: `${baseUrl}/pricing`,
      orderResultUrl: `${baseUrl}/api/subscription/return`,
    });

    const formHtml = getEcpayFormHtml(params);

    return new NextResponse(formHtml, {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  } catch (error) {
    console.error("POST /api/subscription/checkout error:", error);
    return NextResponse.json({ error: "建立訂閱失敗" }, { status: 500 });
  }
}
