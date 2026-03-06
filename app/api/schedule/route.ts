import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { scheduledPosts, socialAccounts, brands, drafts } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { getAuthUser, isSubscriber } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "請先登入" }, { status: 401 });
    }

    const brandId = request.nextUrl.searchParams.get("brandId");
    const status = request.nextUrl.searchParams.get("status");

    let query = db
      .select({
        id: scheduledPosts.id,
        brandId: scheduledPosts.brandId,
        platform: scheduledPosts.platform,
        content: scheduledPosts.content,
        imageUrl: scheduledPosts.imageUrl,
        scheduledAt: scheduledPosts.scheduledAt,
        status: scheduledPosts.status,
        publishedPostId: scheduledPosts.publishedPostId,
        publishError: scheduledPosts.publishError,
        createdAt: scheduledPosts.createdAt,
      })
      .from(scheduledPosts)
      .orderBy(desc(scheduledPosts.scheduledAt))
      .$dynamic();

    const conditions = [];

    if (isSubscriber(user)) {
      conditions.push(eq(scheduledPosts.createdBy, user.userId));
    }
    if (brandId) {
      conditions.push(eq(scheduledPosts.brandId, brandId));
    }
    if (status) {
      conditions.push(eq(scheduledPosts.status, status));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const posts = await query.limit(100);
    return NextResponse.json(posts);
  } catch (error) {
    console.error("List scheduled posts error:", error);
    return NextResponse.json({ error: "查詢失敗" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "請先登入" }, { status: 401 });
    }

    const body = await request.json();
    const { brandId, socialAccountId, platform, content, imageUrl, scheduledAt, draftId } = body;

    if (!brandId || !socialAccountId || !platform || !content || !scheduledAt) {
      return NextResponse.json({ error: "缺少必要欄位" }, { status: 400 });
    }

    // Verify social account exists and is active
    const [account] = await db
      .select()
      .from(socialAccounts)
      .where(and(eq(socialAccounts.id, socialAccountId), eq(socialAccounts.status, "active")));

    if (!account) {
      return NextResponse.json({ error: "社群帳號不存在或已停用" }, { status: 400 });
    }

    // Verify scheduled time is in the future
    if (new Date(scheduledAt) <= new Date()) {
      return NextResponse.json({ error: "排程時間必須在未來" }, { status: 400 });
    }

    // Create with status "queued" directly — user already confirmed in the 5-step form
    const [post] = await db
      .insert(scheduledPosts)
      .values({
        draftId: draftId || null,
        brandId,
        socialAccountId,
        platform,
        content,
        imageUrl: imageUrl || null,
        scheduledAt: new Date(scheduledAt),
        status: "queued",
        createdBy: user.userId,
      })
      .returning();

    // Update draft status to "scheduled" if linked
    if (draftId) {
      await db.update(drafts).set({ status: "scheduled", updatedAt: new Date() }).where(eq(drafts.id, draftId));
    }

    return NextResponse.json(post, { status: 201 });
  } catch (error) {
    console.error("Create scheduled post error:", error);
    return NextResponse.json({ error: "建立排程失敗" }, { status: 500 });
  }
}
