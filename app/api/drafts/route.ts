import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { drafts, brands, agents } from "@/lib/db/schema";
import { eq, desc, and } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const brandId = searchParams.get("brandId");

    const conditions = [];
    if (brandId) {
      conditions.push(eq(drafts.brandId, brandId));
    }

    const allDrafts = await db
      .select({
        id: drafts.id,
        brandId: drafts.brandId,
        agentId: drafts.agentId,
        platform: drafts.platform,
        topic: drafts.topic,
        content: drafts.content,
        status: drafts.status,
        createdAt: drafts.createdAt,
      })
      .from(drafts)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(drafts.createdAt))
      .limit(50);

    return NextResponse.json(allDrafts);
  } catch (error) {
    console.error("Error fetching drafts:", error);
    return NextResponse.json(
      { error: "Failed to fetch drafts" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { brandId, agentId, conversationId, platform, topic, content } = body;

    if (!content) {
      return NextResponse.json(
        { error: "Content is required" },
        { status: 400 }
      );
    }

    const [newDraft] = await db
      .insert(drafts)
      .values({
        brandId: brandId || null,
        agentId: agentId || null,
        conversationId: conversationId || null,
        platform: platform || null,
        topic: topic || null,
        content,
        status: "draft",
      })
      .returning();

    return NextResponse.json(newDraft, { status: 201 });
  } catch (error) {
    console.error("Error creating draft:", error);
    return NextResponse.json(
      { error: "Failed to create draft" },
      { status: 500 }
    );
  }
}
