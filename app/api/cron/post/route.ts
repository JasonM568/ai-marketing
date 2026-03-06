import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { scheduledPosts, socialAccounts } from "@/lib/db/schema";
import { eq, and, lte } from "drizzle-orm";
import { decrypt } from "@/lib/crypto";
import { postToFacebook, postToInstagram, postToThreads } from "@/lib/meta";

const MAX_RETRIES = 3;

export async function GET(request: NextRequest) {
  try {
    // Verify CRON_SECRET
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();

    // Find queued posts that are due
    const duePosts = await db
      .select()
      .from(scheduledPosts)
      .where(
        and(
          eq(scheduledPosts.status, "queued"),
          lte(scheduledPosts.scheduledAt, now)
        )
      );

    const results: { id: string; status: string; error?: string }[] = [];

    for (const post of duePosts) {
      try {
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
          throw new Error("Social account not found");
        }

        if (account.status !== "active") {
          throw new Error("Social account is not active");
        }

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
          throw new Error(`Unsupported platform: ${post.platform}`);
        }

        // Success - update status
        await db
          .update(scheduledPosts)
          .set({
            status: "published",
            publishedPostId,
            updatedAt: new Date(),
          })
          .where(eq(scheduledPosts.id, post.id));

        results.push({ id: post.id, status: "published" });
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Unknown error";
        const newRetryCount = (post.retryCount || 0) + 1;
        const newStatus = newRetryCount >= MAX_RETRIES ? "failed" : "queued";

        await db
          .update(scheduledPosts)
          .set({
            status: newStatus,
            publishError: errorMessage,
            retryCount: newRetryCount,
            updatedAt: new Date(),
          })
          .where(eq(scheduledPosts.id, post.id));

        results.push({ id: post.id, status: newStatus, error: errorMessage });
      }
    }

    return NextResponse.json({
      processed: duePosts.length,
      results,
    });
  } catch (error) {
    console.error("Cron post error:", error);
    return NextResponse.json({ error: "Cron job failed" }, { status: 500 });
  }
}
