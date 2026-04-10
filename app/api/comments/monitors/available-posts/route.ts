import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { socialAccounts } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getAuthUser } from "@/lib/auth";
import { canAccessBrand } from "@/lib/brand-access";
import { decrypt } from "@/lib/crypto";
import { getFacebookPagePosts, getInstagramUserMedia } from "@/lib/meta";
import { getThreadsUserPosts } from "@/lib/threads";

// GET /api/comments/monitors/available-posts?accountId=xxx&limit=20
// Fetch recent posts directly from the platform's Graph API
// so users can monitor posts published outside this system
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "請先登入" }, { status: 401 });
    }

    const accountId = request.nextUrl.searchParams.get("accountId");
    const limitParam = request.nextUrl.searchParams.get("limit");
    const limit = Math.min(Math.max(parseInt(limitParam || "20", 10), 1), 50);

    if (!accountId) {
      return NextResponse.json({ error: "缺少 accountId" }, { status: 400 });
    }

    // Fetch the social account
    const [account] = await db
      .select()
      .from(socialAccounts)
      .where(eq(socialAccounts.id, accountId));

    if (!account) {
      return NextResponse.json({ error: "社群帳號不存在" }, { status: 404 });
    }

    // Verify brand access
    const hasAccess = await canAccessBrand(user, account.brandId);
    if (!hasAccess) {
      return NextResponse.json({ error: "權限不足" }, { status: 403 });
    }

    if (account.status !== "active") {
      return NextResponse.json({ error: "社群帳號已停用" }, { status: 400 });
    }

    // Decrypt token
    let token: string;
    try {
      token = decrypt(account.accessToken);
    } catch {
      return NextResponse.json(
        { error: "Token 解密失敗，請重新連結社群帳號" },
        { status: 400 }
      );
    }

    const platform = account.platform.toLowerCase();

    // Fetch posts based on platform
    try {
      if (platform === "facebook" || platform === "fb") {
        if (!account.pageId) {
          return NextResponse.json({ error: "Facebook page ID 不存在" }, { status: 400 });
        }
        const posts = await getFacebookPagePosts(account.pageId, token, limit);
        return NextResponse.json({
          posts: posts.map((p) => ({
            id: p.id,
            content: p.message || "(無文字內容)",
            createdTime: p.created_time || null,
          })),
        });
      }

      if (platform === "instagram" || platform === "ig") {
        if (!account.platformUserId) {
          return NextResponse.json({ error: "Instagram user ID 不存在" }, { status: 400 });
        }
        const media = await getInstagramUserMedia(account.platformUserId, token, limit);
        return NextResponse.json({
          posts: media.map((m) => ({
            id: m.id,
            content: m.caption || "(無圖說)",
            createdTime: m.timestamp || null,
          })),
        });
      }

      if (platform === "threads") {
        const posts = await getThreadsUserPosts(token, limit);
        return NextResponse.json({
          posts: posts.map((p) => ({
            id: p.id,
            content: p.text || "(無文字內容)",
            createdTime: p.timestamp || null,
          })),
        });
      }

      return NextResponse.json({ error: `不支援的平台：${platform}` }, { status: 400 });
    } catch (err) {
      const message = err instanceof Error ? err.message : "撈取貼文失敗";
      console.error("Fetch available posts error:", err);
      return NextResponse.json(
        { error: `撈取貼文失敗：${message}` },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Available posts error:", error);
    return NextResponse.json({ error: "查詢失敗" }, { status: 500 });
  }
}
