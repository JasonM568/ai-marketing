import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { db } from "@/lib/db";
import { socialAccounts } from "@/lib/db/schema";
import { exchangeThreadsCode, getThreadsLongLivedToken, getThreadsProfile } from "@/lib/threads";
import { encrypt } from "@/lib/crypto";

const secret = new TextEncoder().encode(process.env.JWT_SECRET || "fallback-secret-change-me");

export async function GET(request: NextRequest) {
  try {
    const code = request.nextUrl.searchParams.get("code");
    const state = request.nextUrl.searchParams.get("state");
    const error = request.nextUrl.searchParams.get("error");

    if (error) {
      console.error("Threads OAuth denied:", error);
      return NextResponse.redirect(new URL("/brands?error=threads_oauth_denied", request.url));
    }

    if (!code || !state) {
      return NextResponse.redirect(new URL("/brands?error=missing_params", request.url));
    }

    // Verify state JWT
    let brandId: string;
    let userId: string;
    try {
      const { payload } = await jwtVerify(state, secret);
      brandId = payload.brandId as string;
      userId = payload.userId as string;
    } catch {
      return NextResponse.redirect(new URL("/brands?error=invalid_state", request.url));
    }

    // Exchange code for short-lived token
    const shortToken = await exchangeThreadsCode(code);

    // Exchange for long-lived token (60 days)
    const { token: longToken, expiresIn } = await getThreadsLongLivedToken(shortToken);
    const tokenExpiresAt = new Date(Date.now() + expiresIn * 1000);

    // Get Threads profile
    const profile = await getThreadsProfile(longToken);

    // Save Threads account
    await db
      .insert(socialAccounts)
      .values({
        brandId,
        platform: "threads",
        platformUserId: profile.id,
        platformUsername: profile.username,
        pageId: null, // Threads doesn't use page IDs
        accessToken: encrypt(longToken),
        tokenExpiresAt,
        scopes: "threads_basic,threads_content_publish,threads_read_replies,threads_manage_replies",
        metaUserId: userId,
        connectedBy: userId,
        status: "active",
      })
      .onConflictDoUpdate({
        target: [socialAccounts.brandId, socialAccounts.platform],
        set: {
          platformUserId: profile.id,
          platformUsername: profile.username,
          accessToken: encrypt(longToken),
          tokenExpiresAt,
          scopes: "threads_basic,threads_content_publish,threads_read_replies,threads_manage_replies",
          status: "active",
          updatedAt: new Date(),
        },
      });

    return NextResponse.redirect(
      new URL(`/brands/${brandId}/social?success=threads_connected`, request.url)
    );
  } catch (error) {
    console.error("Threads callback error:", error);
    return NextResponse.redirect(new URL("/brands?error=threads_callback_failed", request.url));
  }
}
