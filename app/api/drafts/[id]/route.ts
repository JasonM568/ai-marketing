import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { drafts, brands, agents } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getAuthUser, isAdmin } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const [draft] = await db
      .select({
        id: drafts.id,
        brandId: drafts.brandId,
        agentId: drafts.agentId,
        conversationId: drafts.conversationId,
        platform: drafts.platform,
        topic: drafts.topic,
        content: drafts.content,
        status: drafts.status,
        metadata: drafts.metadata,
        createdBy: drafts.createdBy,
        createdAt: drafts.createdAt,
        updatedAt: drafts.updatedAt,
        brandName: brands.name,
        brandCode: brands.brandCode,
        agentName: agents.name,
        agentIcon: agents.icon,
        agentRole: agents.role,
      })
      .from(drafts)
      .leftJoin(brands, eq(drafts.brandId, brands.id))
      .leftJoin(agents, eq(drafts.agentId, agents.id))
      .where(eq(drafts.id, id))
      .limit(1);

    if (!draft) {
      return NextResponse.json({ error: "Draft not found" }, { status: 404 });
    }

    // Editor can only view own drafts
    if (!isAdmin(user) && draft.createdBy !== user.userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json(draft);
  } catch (error) {
    console.error("Error fetching draft:", error);
    return NextResponse.json(
      { error: "Failed to fetch draft" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Check ownership for editor
    if (!isAdmin(user)) {
      const [existing] = await db
        .select({ createdBy: drafts.createdBy })
        .from(drafts)
        .where(eq(drafts.id, id))
        .limit(1);

      if (!existing || existing.createdBy !== user.userId) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    const body = await request.json();
    const { content, status, topic, platform } = body;

    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    if (content !== undefined) updateData.content = content;
    if (status !== undefined) updateData.status = status;
    if (topic !== undefined) updateData.topic = topic;
    if (platform !== undefined) updateData.platform = platform;

    const [updated] = await db
      .update(drafts)
      .set(updateData)
      .where(eq(drafts.id, id))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: "Draft not found" }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating draft:", error);
    return NextResponse.json(
      { error: "Failed to update draft" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Check ownership for editor
    if (!isAdmin(user)) {
      const [existing] = await db
        .select({ createdBy: drafts.createdBy })
        .from(drafts)
        .where(eq(drafts.id, id))
        .limit(1);

      if (!existing || existing.createdBy !== user.userId) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    const [deleted] = await db
      .delete(drafts)
      .where(eq(drafts.id, id))
      .returning();

    if (!deleted) {
      return NextResponse.json({ error: "Draft not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting draft:", error);
    return NextResponse.json(
      { error: "Failed to delete draft" },
      { status: 500 }
    );
  }
}
