import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { scheduledPosts } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getAuthUser } from "@/lib/auth";

export async function GET(
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

    return NextResponse.json(post);
  } catch (error) {
    console.error("Get scheduled post error:", error);
    return NextResponse.json({ error: "查詢失敗" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "請先登入" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    const [existing] = await db.select().from(scheduledPosts).where(eq(scheduledPosts.id, id));
    if (!existing) {
      return NextResponse.json({ error: "排程不存在" }, { status: 404 });
    }

    // Only allow updates if pending
    if (existing.status !== "pending") {
      return NextResponse.json({ error: "只能修改待確認的排程" }, { status: 400 });
    }

    const updates: Record<string, any> = { updatedAt: new Date() };

    if (body.content) updates.content = body.content;
    if (body.scheduledAt) updates.scheduledAt = new Date(body.scheduledAt);
    if (body.imageUrl !== undefined) updates.imageUrl = body.imageUrl;

    // Allow confirming (pending → queued)
    if (body.status === "queued") {
      updates.status = "queued";
    }

    const [updated] = await db
      .update(scheduledPosts)
      .set(updates)
      .where(eq(scheduledPosts.id, id))
      .returning();

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Update scheduled post error:", error);
    return NextResponse.json({ error: "更新失敗" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "請先登入" }, { status: 401 });
    }

    const { id } = await params;
    const [existing] = await db.select().from(scheduledPosts).where(eq(scheduledPosts.id, id));
    if (!existing) {
      return NextResponse.json({ error: "排程不存在" }, { status: 404 });
    }

    if (existing.status === "published") {
      return NextResponse.json({ error: "已發布的排程無法取消" }, { status: 400 });
    }

    await db
      .update(scheduledPosts)
      .set({ status: "cancelled", updatedAt: new Date() })
      .where(eq(scheduledPosts.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Cancel scheduled post error:", error);
    return NextResponse.json({ error: "取消失敗" }, { status: 500 });
  }
}
