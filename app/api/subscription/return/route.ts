import { NextRequest, NextResponse } from "next/server";
import { parseEcpayCallback } from "@/lib/ecpay";

// POST /api/subscription/return — ECPay 付款後導回（用戶端）
export async function POST(request: NextRequest) {
  try {
    const bodyText = await request.text();
    const params = parseEcpayCallback(bodyText);
    const rtnCode = params.RtnCode;
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || request.nextUrl.origin;

    if (rtnCode === "1") {
      // Success — redirect to success page
      return NextResponse.redirect(`${baseUrl}/checkout/success`, { status: 303 });
    } else {
      // Failed — redirect back to pricing with error
      return NextResponse.redirect(`${baseUrl}/pricing?error=payment_failed`, { status: 303 });
    }
  } catch (error) {
    console.error("ECPay return error:", error);
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || request.nextUrl.origin;
    return NextResponse.redirect(`${baseUrl}/pricing?error=unknown`, { status: 303 });
  }
}
