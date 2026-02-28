import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { drafts, brands, agents } from "@/lib/db/schema";
import { eq, desc, and, sql } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const brandId = searchParams.get("brandId");
    const agentId = searchParams.get("agentId");
    const status = searchParams.get("status");
    const search = searchParams.get("search");

    const conditions = [];
    if (brandId) conditions.push(eq(drafts.brandId, brandId));
    if (agentId) conditions.push(eq(drafts.agentId, agentId));
    if (status && status !== "all") conditions.push(eq(drafts.status, status));
    if (search) {
      conditions.push(
        sql`(${drafts.topic} ILIKE ${"%" + search + "%"} OR ${drafts.content} ILIKE ${"%" + search + "%"})`
      );
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
        metadata: drafts.metadata,
        createdAt: drafts.createdAt,
        updatedAt: drafts.updatedAt,
        brandName: brands.name,
        brandCode: brands.brandCode,
        agentName: agents.name,
        agentIcon: agents.icon,
      })
      .from(drafts)
      .leftJoin(brands, eq(drafts.brandId, brands.id))
      .leftJoin(agents, eq(drafts.agentId, agents.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(drafts.createdAt))
      .limit(100);

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
