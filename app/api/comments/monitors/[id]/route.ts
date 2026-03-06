import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { commentMonitors } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getAuthUser } from "@/lib/auth";

// PATCH: Update a monitor (toggle status, change mode)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "請先登入" }, { status: 401 });

    const { id } = await params;
    const body = await request.json();
    const { status, monitorMode, publishedPostId, postContentPreview } = body;

    const updateData: Record<string, any> = { updatedAt: new Date() };
    if (status) updateData.status = status;
    if (monitorMode) {
      updateData.monitorMode = monitorMode;
      if (monitorMode === "all") {
        updateData.publishedPostId = null;
      } else if (publishedPostId) {
        updateData.publishedPostId = publishedPostId;
      }
    }
    if (postContentPreview !== undefined) {
      updateData.postContentPreview = postContentPreview?.slice(0, 100) || null;
    }

    const [updated] = await db
      .update(commentMonitors)
      .set(updateData)
      .where(eq(commentMonitors.id, id))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: "監控不存在" }, { status: 404 });
    }

    return NextResponse.json({ monitor: updated });
  } catch (error) {
    console.error("Update monitor error:", error);
    return NextResponse.json({ error: "更新監控失敗" }, { status: 500 });
  }
}

// DELETE: Remove a monitor
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "請先登入" }, { status: 401 });

    const { id } = await params;

    const [deleted] = await db
      .delete(commentMonitors)
      .where(eq(commentMonitors.id, id))
      .returning();

    if (!deleted) {
      return NextResponse.json({ error: "監控不存在" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete monitor error:", error);
    return NextResponse.json({ error: "刪除監控失敗" }, { status: 500 });
  }
}
