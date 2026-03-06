import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { paymentRecords } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { getAuthUser } from "@/lib/auth";

// GET /api/subscription/billing — 付款紀錄
export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "請先登入" }, { status: 401 });
    }

    const records = await db
      .select({
        id: paymentRecords.id,
        ecpayMerchantTradeNo: paymentRecords.ecpayMerchantTradeNo,
        ecpayTradeNo: paymentRecords.ecpayTradeNo,
        planId: paymentRecords.planId,
        amount: paymentRecords.amount,
        status: paymentRecords.status,
        paymentType: paymentRecords.paymentType,
        createdAt: paymentRecords.createdAt,
      })
      .from(paymentRecords)
      .where(eq(paymentRecords.userId, user.userId))
      .orderBy(desc(paymentRecords.createdAt))
      .limit(50);

    return NextResponse.json(records);
  } catch (error) {
    console.error("GET /api/subscription/billing error:", error);
    return NextResponse.json({ error: "查詢帳單失敗" }, { status: 500 });
  }
}
