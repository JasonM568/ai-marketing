import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { db } from "@/lib/db";
import { socialAccounts } from "@/lib/db/schema";
import { exchangeThreadsCode, getThreadsLongLivedToken, getThreadsProfile } from "@/lib/threads";
import { encrypt } from "@/lib/crypto";

const secret = new TextEncoder().encode(process.env.JWT_SECRET || "fallback-secret-change-me");

export async function GET(request: NextRequest) {
  // Parse brandId early so error redirects go to the correct page
  let brandId: string | null = null;

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
    let userId: string;
    try {
      const { payload } = await jwtVerify(state, secret);
      brandId = payload.brandId as string;
      userId = payload.userId as string;
    } catch {
      return NextResponse.redirect(new URL("/brands?error=invalid_state", request.url));
    }

    // Step 1: Exchange code for short-lived token
    let shortToken: string;
    try {
      shortToken = await exchangeThreadsCode(code);
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      console.error("Threads token exchange failed:", errMsg);
      const detail = encodeURIComponent(errMsg.slice(0, 200));
      return NextResponse.redirect(
        new URL(`/brands/${brandId}/social?error=token_exchange_failed&detail=${detail}`, request.url)
      );
    }

    // Step 2: Exchange for long-lived token (60 days)
    let longToken: string;
    let tokenExpiresAt: Date;
    try {
      const result = await getThreadsLongLivedToken(shortToken);
      longToken = result.token;
      tokenExpiresAt = new Date(Date.now() + result.expiresIn * 1000);
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      console.error("Threads long-lived token failed:", errMsg);
      // Include truncated error detail for debugging
      const detail = encodeURIComponent(errMsg.slice(0, 200));
      return NextResponse.redirect(
        new URL(`/brands/${brandId}/social?error=long_token_failed&detail=${detail}`, request.url)
      );
    }

    // Step 3: Get Threads profile
    let profile: { id: string; username: string };
    try {
      profile = await getThreadsProfile(longToken);
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      console.error("Threads profile fetch failed:", errMsg);
      const detail = encodeURIComponent(errMsg.slice(0, 200));
      return NextResponse.redirect(
        new URL(`/brands/${brandId}/social?error=profile_fetch_failed&detail=${detail}`, request.url)
      );
    }

    // Step 4: Save Threads account (upsert)
    try {
      await db
        .insert(socialAccounts)
        .values({
          brandId,
          platform: "threads",
          platformUserId: profile.id,
          platformUsername: profile.username,
          pageId: null,
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
    } catch (err) {
      console.error("Threads DB save failed:", err);
      return NextResponse.redirect(
        new URL(`/brands/${brandId}/social?error=db_save_failed`, request.url)
      );
    }

    console.log(`Threads connected: brand=${brandId}, user=${profile.username}`);
    return NextResponse.redirect(
      new URL(`/brands/${brandId}/social?success=threads_connected`, request.url)
    );
  } catch (error) {
    console.error("Threads callback unexpected error:", error);
    const errorUrl = brandId
      ? `/brands/${brandId}/social?error=threads_callback_failed`
      : "/brands?error=threads_callback_failed";
    return NextResponse.redirect(new URL(errorUrl, request.url));
  }
}
