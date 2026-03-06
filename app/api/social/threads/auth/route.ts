import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { getThreadsOAuthUrl } from "@/lib/threads";
import { SignJWT } from "jose";

const secret = new TextEncoder().encode(process.env.JWT_SECRET || "fallback-secret-change-me");

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

    // Encode brandId + userId into state (signed JWT to prevent tampering)
    const state = await new SignJWT({ brandId, userId: user.userId })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("10m")
      .sign(secret);

    const url = getThreadsOAuthUrl(state);
    return NextResponse.redirect(url);
  } catch (error) {
    console.error("Threads auth error:", error);
    return NextResponse.json({ error: "Threads OAuth 發起失敗" }, { status: 500 });
  }
}
