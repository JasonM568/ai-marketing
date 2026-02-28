import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { drafts, brands, agents, conversations } from "@/lib/db/schema";
import { eq, sql, desc } from "drizzle-orm";

export async function GET() {
  try {
    // Total counts
    const [brandCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(brands);

    const [agentCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(agents);

    const [draftCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(drafts);

    const [conversationCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(conversations);

    // Drafts by status
    const draftsByStatus = await db
      .select({
        status: drafts.status,
        count: sql<number>`count(*)::int`,
      })
      .from(drafts)
      .groupBy(drafts.status);

    // Drafts by brand (top 10)
    const draftsByBrand = await db
      .select({
        brandName: brands.name,
        brandCode: brands.brandCode,
        count: sql<number>`count(*)::int`,
      })
      .from(drafts)
      .leftJoin(brands, eq(drafts.brandId, brands.id))
      .groupBy(brands.name, brands.brandCode)
      .orderBy(desc(sql`count(*)`))
      .limit(10);

    // Drafts by agent (top 12)
    const draftsByAgent = await db
      .select({
        agentName: agents.name,
        agentIcon: agents.icon,
        agentCategory: agents.category,
        count: sql<number>`count(*)::int`,
      })
      .from(drafts)
      .leftJoin(agents, eq(drafts.agentId, agents.id))
      .groupBy(agents.name, agents.icon, agents.category)
      .orderBy(desc(sql`count(*)`))
      .limit(12);

    // Recent drafts (last 5)
    const recentDrafts = await db
      .select({
        id: drafts.id,
        topic: drafts.topic,
        status: drafts.status,
        createdAt: drafts.createdAt,
        brandName: brands.name,
        agentName: agents.name,
        agentIcon: agents.icon,
      })
      .from(drafts)
      .leftJoin(brands, eq(drafts.brandId, brands.id))
      .leftJoin(agents, eq(drafts.agentId, agents.id))
      .orderBy(desc(drafts.createdAt))
      .limit(5);

    // Drafts per day (last 7 days)
    const dailyDrafts = await db
      .select({
        date: sql<string>`to_char(${drafts.createdAt}, 'MM/DD')`,
        count: sql<number>`count(*)::int`,
      })
      .from(drafts)
      .where(sql`${drafts.createdAt} > now() - interval '7 days'`)
      .groupBy(sql`to_char(${drafts.createdAt}, 'MM/DD')`)
      .orderBy(sql`to_char(${drafts.createdAt}, 'MM/DD')`);

    return NextResponse.json({
      totals: {
        brands: brandCount.count,
        agents: agentCount.count,
        drafts: draftCount.count,
        conversations: conversationCount.count,
      },
      draftsByStatus,
      draftsByBrand,
      draftsByAgent,
      recentDrafts,
      dailyDrafts,
    });
  } catch (error) {
    console.error("Stats error:", error);
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 }
    );
  }
}
