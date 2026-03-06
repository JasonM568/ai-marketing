import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { db } from "@/lib/db";
import { socialAccounts } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { exchangeCodeForToken, getLongLivedToken, getPageTokens, getInstagramAccountId, getThreadsUserId } from "@/lib/meta";
import { encrypt } from "@/lib/crypto";

const secret = new TextEncoder().encode(process.env.JWT_SECRET || "fallback-secret-change-me");

export async function GET(request: NextRequest) {
  try {
    const code = request.nextUrl.searchParams.get("code");
    const state = request.nextUrl.searchParams.get("state");
    const error = request.nextUrl.searchParams.get("error");

    if (error) {
      console.error("Meta OAuth denied:", error);
      return NextResponse.redirect(new URL("/brands?error=oauth_denied", request.url));
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
    const shortToken = await exchangeCodeForToken(code);

    // Exchange for long-lived token (60 days)
    const { token: longToken, expiresIn } = await getLongLivedToken(shortToken);
    const tokenExpiresAt = new Date(Date.now() + expiresIn * 1000);

    // Get user's Facebook Pages
    const pages = await getPageTokens(longToken);

    if (pages.length === 0) {
      return NextResponse.redirect(new URL(`/brands/${brandId}/social?error=no_pages`, request.url));
    }

    // Use the first page (most common scenario)
    const page = pages[0];

    // Save Facebook Page account
    await db
      .insert(socialAccounts)
      .values({
        brandId,
        platform: "facebook",
        platformUserId: page.id,
        platformUsername: page.name,
        pageId: page.id,
        accessToken: encrypt(page.accessToken),
        tokenExpiresAt,
        scopes: "pages_manage_posts,pages_read_engagement",
        metaUserId: userId,
        connectedBy: userId,
        status: "active",
      })
      .onConflictDoUpdate({
        target: [socialAccounts.brandId, socialAccounts.platform],
        set: {
          platformUserId: page.id,
          platformUsername: page.name,
          pageId: page.id,
          accessToken: encrypt(page.accessToken),
          tokenExpiresAt,
          status: "active",
          updatedAt: new Date(),
        },
      });

    // Try to get Instagram Business Account
    const igAccount = await getInstagramAccountId(page.id, page.accessToken);
    if (igAccount) {
      await db
        .insert(socialAccounts)
        .values({
          brandId,
          platform: "instagram",
          platformUserId: igAccount.igUserId,
          platformUsername: igAccount.igUsername,
          pageId: page.id,
          accessToken: encrypt(page.accessToken),
          tokenExpiresAt,
          scopes: "instagram_basic,instagram_content_publish",
          metaUserId: userId,
          connectedBy: userId,
          status: "active",
        })
        .onConflictDoUpdate({
          target: [socialAccounts.brandId, socialAccounts.platform],
          set: {
            platformUserId: igAccount.igUserId,
            platformUsername: igAccount.igUsername,
            accessToken: encrypt(page.accessToken),
            tokenExpiresAt,
            status: "active",
            updatedAt: new Date(),
          },
        });
    }

    // Try to get Threads account
    const threadsAccount = await getThreadsUserId(longToken);
    if (threadsAccount) {
      await db
        .insert(socialAccounts)
        .values({
          brandId,
          platform: "threads",
          platformUserId: threadsAccount.threadsId,
          platformUsername: threadsAccount.threadsUsername,
          pageId: page.id,
          accessToken: encrypt(longToken),
          tokenExpiresAt,
          scopes: "threads_basic,threads_content_publish",
          metaUserId: userId,
          connectedBy: userId,
          status: "active",
        })
        .onConflictDoUpdate({
          target: [socialAccounts.brandId, socialAccounts.platform],
          set: {
            platformUserId: threadsAccount.threadsId,
            platformUsername: threadsAccount.threadsUsername,
            accessToken: encrypt(longToken),
            tokenExpiresAt,
            status: "active",
            updatedAt: new Date(),
          },
        });
    }

    return NextResponse.redirect(new URL(`/brands/${brandId}/social?success=connected`, request.url));
  } catch (error) {
    console.error("Meta callback error:", error);
    return NextResponse.redirect(new URL("/brands?error=callback_failed", request.url));
  }
}
