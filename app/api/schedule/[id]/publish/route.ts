import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { scheduledPosts, socialAccounts } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getAuthUser } from "@/lib/auth";
import { decrypt } from "@/lib/crypto";
import { postToFacebook, postToInstagram, postToThreads } from "@/lib/meta";
import { canAccessBrand } from "@/lib/brand-access";

// POST /api/schedule/[id]/publish — manually trigger immediate publish
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "請先登入" }, { status: 401 });
    }

    const { id } = await params;
    const [post] = await db.select().from(scheduledPosts).where(eq(scheduledPosts.id, id));

    if (!post) {
      return NextResponse.json({ error: "排程不存在" }, { status: 404 });
    }

    // Check brand access
    const hasAccess = await canAccessBrand(user, post.brandId);
    if (!hasAccess) {
      return NextResponse.json({ error: "權限不足" }, { status: 403 });
    }

    // Only queued or failed posts can be manually published
    if (post.status !== "queued" && post.status !== "failed") {
      return NextResponse.json(
        { error: `無法發布，目前狀態為：${post.status}` },
        { status: 400 }
      );
    }

    // Update status to posting
    await db
      .update(scheduledPosts)
      .set({ status: "posting", updatedAt: new Date() })
      .where(eq(scheduledPosts.id, post.id));

    // Get social account
    const [account] = await db
      .select()
      .from(socialAccounts)
      .where(eq(socialAccounts.id, post.socialAccountId));

    if (!account) {
      await db
        .update(scheduledPosts)
        .set({ status: "failed", publishError: "社群帳號不存在", updatedAt: new Date() })
        .where(eq(scheduledPosts.id, post.id));
      return NextResponse.json({ error: "社群帳號不存在" }, { status: 400 });
    }

    if (account.status !== "active") {
      await db
        .update(scheduledPosts)
        .set({ status: "failed", publishError: "社群帳號已停用", updatedAt: new Date() })
        .where(eq(scheduledPosts.id, post.id));
      return NextResponse.json({ error: "社群帳號已停用" }, { status: 400 });
    }

    try {
      // Decrypt token
      const token = decrypt(account.accessToken);

      // Post based on platform
      let publishedPostId: string;
      const platform = post.platform.toLowerCase();

      if (platform === "facebook" || platform === "fb") {
        if (!account.pageId) {
          throw new Error("Facebook page ID not found");
        }
        publishedPostId = await postToFacebook(
          account.pageId,
          token,
          post.content,
          post.imageUrl || undefined
        );
      } else if (platform === "instagram" || platform === "ig") {
        if (!account.platformUserId) {
          throw new Error("Instagram user ID not found");
        }
        publishedPostId = await postToInstagram(
          account.platformUserId,
          token,
          post.content,
          post.imageUrl || undefined
        );
      } else if (platform === "threads") {
        if (!account.platformUserId) {
          throw new Error("Threads user ID not found");
        }
        publishedPostId = await postToThreads(
          account.platformUserId,
          token,
          post.content,
          post.imageUrl || undefined
        );
      } else {
        throw new Error(`不支援的平台: ${post.platform}`);
      }

      // Success
      const [updated] = await db
        .update(scheduledPosts)
        .set({
          status: "published",
          publishedPostId,
          updatedAt: new Date(),
        })
        .where(eq(scheduledPosts.id, post.id))
        .returning();

      return NextResponse.json({ success: true, post: updated });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      const newRetryCount = (post.retryCount || 0) + 1;

      const [updated] = await db
        .update(scheduledPosts)
        .set({
          status: "failed",
          publishError: errorMessage,
          retryCount: newRetryCount,
          updatedAt: new Date(),
        })
        .where(eq(scheduledPosts.id, post.id))
        .returning();

      return NextResponse.json(
        { error: `發布失敗: ${errorMessage}`, post: updated },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Manual publish error:", error);
    return NextResponse.json({ error: "發布失敗" }, { status: 500 });
  }
}
