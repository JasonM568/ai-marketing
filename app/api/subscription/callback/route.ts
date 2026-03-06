import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { subscriptions, paymentRecords } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { validateCheckMacValue, parseEcpayCallback } from "@/lib/ecpay";
import { assignPlanCredits } from "@/lib/credits";

// POST /api/subscription/callback — ECPay 首次付款 server-to-server 回呼
export async function POST(request: NextRequest) {
  try {
    const bodyText = await request.text();
    const params = parseEcpayCallback(bodyText);

    // Validate CheckMacValue
    if (!validateCheckMacValue(params)) {
      console.error("ECPay callback: CheckMacValue validation failed");
      return new NextResponse("0|CheckMacValue Error", { status: 400 });
    }

    const merchantTradeNo = params.MerchantTradeNo;
    const rtnCode = params.RtnCode; // 1 = success
    const tradeNo = params.TradeNo;

    // Find subscription
    const [subscription] = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.ecpayMerchantTradeNo, merchantTradeNo))
      .limit(1);

    if (!subscription) {
      console.error("ECPay callback: subscription not found for", merchantTradeNo);
      return new NextResponse("0|Order Not Found", { status: 404 });
    }

    // Check idempotency — skip if already processed
    if (subscription.status === "active") {
      return new NextResponse("1|OK");
    }

    const now = new Date();
    const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());

    if (rtnCode === "1") {
      // Payment success
      await db
        .update(subscriptions)
        .set({
          status: "active",
          currentPeriodStart: now,
          currentPeriodEnd: periodEnd,
          ecpayCardLast4: params.Card4No || null,
          updatedAt: now,
        })
        .where(eq(subscriptions.id, subscription.id));

      // Update payment record
      await db
        .update(paymentRecords)
        .set({
          ecpayTradeNo: tradeNo,
          status: "paid",
          rawCallback: params,
          updatedAt: now,
        })
        .where(eq(paymentRecords.ecpayMerchantTradeNo, merchantTradeNo));

      // Assign plan credits
      await assignPlanCredits({
        userId: subscription.userId,
        planId: subscription.planId,
        assignedBy: "ecpay",
        description: `訂閱付款成功：自動啟用方案`,
      });
    } else {
      // Payment failed
      await db
        .update(subscriptions)
        .set({ status: "expired", updatedAt: now })
        .where(eq(subscriptions.id, subscription.id));

      await db
        .update(paymentRecords)
        .set({
          ecpayTradeNo: tradeNo,
          status: "failed",
          rawCallback: params,
          updatedAt: now,
        })
        .where(eq(paymentRecords.ecpayMerchantTradeNo, merchantTradeNo));
    }

    // ECPay expects "1|OK" response
    return new NextResponse("1|OK");
  } catch (error) {
    console.error("ECPay callback error:", error);
    return new NextResponse("0|Error", { status: 500 });
  }
}
