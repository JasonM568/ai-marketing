import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { subscriptions, paymentRecords } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { validateCheckMacValue, parseEcpayCallback, generateMerchantTradeNo } from "@/lib/ecpay";
import { resetMonthlyCredits } from "@/lib/credits";

// POST /api/subscription/period-notify — ECPay 每月定期扣款通知
export async function POST(request: NextRequest) {
  try {
    const bodyText = await request.text();
    const params = parseEcpayCallback(bodyText);

    // Validate CheckMacValue
    if (!validateCheckMacValue(params)) {
      console.error("ECPay period-notify: CheckMacValue validation failed");
      return new NextResponse("0|CheckMacValue Error", { status: 400 });
    }

    const merchantTradeNo = params.MerchantTradeNo;
    const rtnCode = params.RtnCode;
    const totalSuccessTimes = parseInt(params.TotalSuccessTimes || "0", 10);

    // Find subscription by original merchant trade no
    const [subscription] = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.ecpayMerchantTradeNo, merchantTradeNo))
      .limit(1);

    if (!subscription) {
      console.error("ECPay period-notify: subscription not found for", merchantTradeNo);
      return new NextResponse("0|Order Not Found", { status: 404 });
    }

    // Check cancel_at_period_end — if user requested cancellation, expire now
    if (subscription.cancelAtPeriodEnd) {
      await db
        .update(subscriptions)
        .set({ status: "expired", updatedAt: new Date() })
        .where(eq(subscriptions.id, subscription.id));

      return new NextResponse("1|OK");
    }

    const now = new Date();
    const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());

    // Create payment record for this period
    const periodTradeNo = generateMerchantTradeNo();

    if (rtnCode === "1") {
      // Recurring payment success
      await db.insert(paymentRecords).values({
        subscriptionId: subscription.id,
        userId: subscription.userId,
        ecpayMerchantTradeNo: periodTradeNo,
        ecpayTradeNo: params.TradeNo || null,
        planId: subscription.planId,
        amount: parseInt(params.TradeAmt || "0", 10),
        status: "paid",
        paymentType: "recurring",
        rawCallback: params,
      });

      // Update subscription period
      await db
        .update(subscriptions)
        .set({
          status: "active",
          currentPeriodStart: now,
          currentPeriodEnd: periodEnd,
          updatedAt: now,
        })
        .where(eq(subscriptions.id, subscription.id));

      // Reset monthly credits
      await resetMonthlyCredits({
        userId: subscription.userId,
        planId: subscription.planId,
        description: `第 ${totalSuccessTimes} 期定期扣款成功，重置點數`,
      });
    } else {
      // Recurring payment failed
      await db.insert(paymentRecords).values({
        subscriptionId: subscription.id,
        userId: subscription.userId,
        ecpayMerchantTradeNo: periodTradeNo,
        planId: subscription.planId,
        amount: parseInt(params.TradeAmt || "0", 10),
        status: "failed",
        paymentType: "recurring",
        rawCallback: params,
      });

      await db
        .update(subscriptions)
        .set({ status: "past_due", updatedAt: now })
        .where(eq(subscriptions.id, subscription.id));
    }

    return new NextResponse("1|OK");
  } catch (error) {
    console.error("ECPay period-notify error:", error);
    return new NextResponse("0|Error", { status: 500 });
  }
}
