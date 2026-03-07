import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { scheduledPosts, socialAccounts, drafts } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { getAuthUser } from "@/lib/auth";
import { decrypt } from "@/lib/crypto";
import { postToFacebook, postToInstagram, postToThreads } from "@/lib/meta";
import { canAccessBrand } from "@/lib/brand-access";

// POST /api/schedule/publish-now — 立即發布貼文
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "請先登入" }, { status: 401 });
    }

    const body = await request.json();
    const { brandId, socialAccountId, platform, content, imageUrl, draftId } = body;

    if (!brandId || !socialAccountId || !platform || !content) {
      return NextResponse.json({ error: "缺少必要欄位" }, { status: 400 });
    }

    // Check brand access
    const hasAccess = await canAccessBrand(user, brandId);
    if (!hasAccess) {
      return NextResponse.json({ error: "權限不足" }, { status: 403 });
    }

    // Verify social account exists and is active
    const [account] = await db
      .select()
      .from(socialAccounts)
      .where(and(eq(socialAccounts.id, socialAccountId), eq(socialAccounts.status, "active")));

    if (!account) {
      return NextResponse.json({ error: "社群帳號不存在或已停用" }, { status: 400 });
    }

    // Create record with status "posting"
    const now = new Date();
    const [post] = await db
      .insert(scheduledPosts)
      .values({
        draftId: draftId || null,
        brandId,
        socialAccountId,
        platform,
        content,
        imageUrl: imageUrl || null,
        scheduledAt: now,
        status: "posting",
        createdBy: user.userId,
      })
      .returning();

    // Update draft status if linked
    if (draftId) {
      await db.update(drafts).set({ status: "scheduled", updatedAt: now }).where(eq(drafts.id, draftId));
    }

    // Decrypt token
    const token = decrypt(account.accessToken);

    // Publish immediately
    try {
      let publishedPostId: string;
      const platformLower = platform.toLowerCase();

      if (platformLower === "facebook" || platformLower === "fb") {
        if (!account.pageId) throw new Error("Facebook page ID not found");
        publishedPostId = await postToFacebook(
          account.pageId,
          token,
          content,
          imageUrl || undefined
        );
      } else if (platformLower === "instagram" || platformLower === "ig") {
        if (!account.platformUserId) throw new Error("Instagram user ID not found");
        publishedPostId = await postToInstagram(
          account.platformUserId,
          token,
          content,
          imageUrl || undefined
        );
      } else if (platformLower === "threads") {
        if (!account.platformUserId) throw new Error("Threads user ID not found");
        publishedPostId = await postToThreads(
          account.platformUserId,
          token,
          content,
          imageUrl || undefined
        );
      } else {
        throw new Error(`不支援的平台: ${platform}`);
      }

      // Success — update status
      await db
        .update(scheduledPosts)
        .set({
          status: "published",
          publishedPostId,
          updatedAt: new Date(),
        })
        .where(eq(scheduledPosts.id, post.id));

      return NextResponse.json({
        ...post,
        status: "published",
        publishedPostId,
      });
    } catch (publishErr) {
      // Publish failed — update status
      const errorMessage = publishErr instanceof Error ? publishErr.message : "發布失敗";
      await db
        .update(scheduledPosts)
        .set({
          status: "failed",
          publishError: errorMessage,
          retryCount: 1,
          updatedAt: new Date(),
        })
        .where(eq(scheduledPosts.id, post.id));

      return NextResponse.json(
        { error: `發布失敗：${errorMessage}`, postId: post.id },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Publish now error:", error);
    return NextResponse.json({ error: "發布失敗，請重試" }, { status: 500 });
  }
}
