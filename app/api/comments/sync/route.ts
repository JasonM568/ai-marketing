import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { commentMonitors, socialAccounts, incomingComments } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { getAuthUser } from "@/lib/auth";
import { decrypt } from "@/lib/crypto";
import {
  getFacebookPostComments,
  getFacebookPagePosts,
  getInstagramMediaComments,
  getInstagramUserMedia,
} from "@/lib/meta";
import {
  getThreadsMediaReplies,
  getThreadsUserPosts,
} from "@/lib/threads";

/**
 * POST /api/comments/sync
 *
 * 主動從社群平台 API 拉取留言（Graph API polling），
 * 不需要依賴 Webhook，適合開發階段和 Hobby plan。
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "請先登入" }, { status: 401 });

    const body = await request.json();
    const { brandId } = body;

    if (!brandId) {
      return NextResponse.json({ error: "缺少 brandId" }, { status: 400 });
    }

    // Get all active monitors for this brand
    const monitors = await db
      .select()
      .from(commentMonitors)
      .where(
        and(
          eq(commentMonitors.brandId, brandId),
          eq(commentMonitors.status, "active")
        )
      );

    if (monitors.length === 0) {
      return NextResponse.json({
        synced: 0,
        message: "此品牌沒有啟用中的監控設定，請先到監控設定頁新增",
      });
    }

    let totalSynced = 0;
    const errors: string[] = [];

    for (const monitor of monitors) {
      try {
        // Get the social account + decrypt token
        const [account] = await db
          .select()
          .from(socialAccounts)
          .where(eq(socialAccounts.id, monitor.socialAccountId))
          .limit(1);

        if (!account || account.status !== "active") {
          errors.push(`帳號 ${monitor.socialAccountId} 不存在或已停用`);
          continue;
        }

        const token = decrypt(account.accessToken);
        const platform = monitor.platform.toLowerCase();

        // Determine which posts to fetch comments from
        let postIds: string[] = [];

        if (monitor.monitorMode === "specific" && monitor.publishedPostId) {
          // Specific post mode — just use the stored post ID
          postIds = [monitor.publishedPostId];
        } else if (monitor.monitorMode === "all") {
          // All posts mode — fetch recent posts first
          postIds = await fetchRecentPostIds(platform, account, token);
        }

        // Fetch comments for each post
        for (const postId of postIds) {
          try {
            const newCount = await fetchAndStoreComments(
              platform,
              postId,
              token,
              account,
              monitor.id,
              brandId
            );
            totalSynced += newCount;
          } catch (err) {
            const msg = err instanceof Error ? err.message : "未知錯誤";
            console.error(`Fetch comments error for post ${postId}:`, msg);
            errors.push(`${platform} 貼文 ${postId.slice(0, 20)}... : ${msg}`);
          }
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : "未知錯誤";
        console.error(`Monitor ${monitor.id} sync error:`, msg);
        errors.push(`監控 ${monitor.id.slice(0, 8)} 失敗: ${msg}`);
      }
    }

    return NextResponse.json({
      synced: totalSynced,
      monitorsProcessed: monitors.length,
      errors: errors.length > 0 ? errors : undefined,
      message:
        totalSynced > 0
          ? `成功同步 ${totalSynced} 則新留言`
          : "沒有新留言",
    });
  } catch (error) {
    console.error("Comment sync error:", error);
    return NextResponse.json({ error: "同步留言失敗" }, { status: 500 });
  }
}

/**
 * Fetch recent post IDs for "all" monitor mode
 */
async function fetchRecentPostIds(
  platform: string,
  account: any,
  token: string
): Promise<string[]> {
  if (platform === "facebook" || platform === "fb") {
    if (!account.pageId) return [];
    const posts = await getFacebookPagePosts(account.pageId, token, 10);
    return posts.map((p) => p.id);
  }

  if (platform === "instagram" || platform === "ig") {
    if (!account.platformUserId) return [];
    const media = await getInstagramUserMedia(account.platformUserId, token, 10);
    return media.map((m) => m.id);
  }

  if (platform === "threads") {
    const posts = await getThreadsUserPosts(token, 10);
    return posts.map((p) => p.id);
  }

  return [];
}

/**
 * Fetch comments from platform API and store new ones in DB
 */
async function fetchAndStoreComments(
  platform: string,
  postId: string,
  token: string,
  account: any,
  monitorId: string,
  brandId: string
): Promise<number> {
  let newCount = 0;

  if (platform === "facebook" || platform === "fb") {
    // FB: use page token
    const comments = await getFacebookPostComments(postId, token, 50);
    for (const c of comments) {
      if (!c.id || !c.message) continue;
      try {
        const result = await db
          .insert(incomingComments)
          .values({
            monitorId,
            brandId,
            platform: "facebook",
            platformCommentId: c.id,
            platformPostId: postId,
            parentCommentId: c.parent?.id || null,
            commenterName: c.from?.name || null,
            commenterId: c.from?.id || null,
            commentText: c.message,
            commentTimestamp: c.created_time ? new Date(c.created_time) : new Date(),
            status: "new",
          })
          .onConflictDoNothing()
          .returning({ id: incomingComments.id });
        if (result.length > 0) newCount++;
      } catch {
        // Error — skip
      }
    }
  }

  if (platform === "instagram" || platform === "ig") {
    const comments = await getInstagramMediaComments(postId, token, 50);
    for (const c of comments) {
      if (!c.id || !c.text) continue;
      try {
        const result = await db
          .insert(incomingComments)
          .values({
            monitorId,
            brandId,
            platform: "instagram",
            platformCommentId: c.id,
            platformPostId: postId,
            parentCommentId: c.parent_id || null,
            commenterName: c.username || null,
            commenterId: c.from?.id || null,
            commentText: c.text,
            commentTimestamp: c.timestamp ? new Date(c.timestamp) : new Date(),
            status: "new",
          })
          .onConflictDoNothing()
          .returning({ id: incomingComments.id });
        if (result.length > 0) newCount++;
      } catch {
        // Error — skip
      }
    }
  }

  if (platform === "threads") {
    const replies = await getThreadsMediaReplies(postId, token, 50);
    for (const r of replies) {
      if (!r.id || !r.text) continue;
      try {
        const result = await db
          .insert(incomingComments)
          .values({
            monitorId,
            brandId,
            platform: "threads",
            platformCommentId: r.id,
            platformPostId: postId,
            parentCommentId: r.replied_to?.id || null,
            commenterName: r.username || null,
            commenterId: null,
            commentText: r.text,
            commentTimestamp: r.timestamp ? new Date(r.timestamp) : new Date(),
            status: "new",
          })
          .onConflictDoNothing()
          .returning({ id: incomingComments.id });
        if (result.length > 0) newCount++;
      } catch {
        // Error — skip
      }
    }
  }

  return newCount;
}
