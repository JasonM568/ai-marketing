import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { drafts, brands, agents, conversations } from "@/lib/db/schema";
import { eq, sql, desc, and } from "drizzle-orm";
import { getAuthUser, isAdmin, isSubscriber } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = isAdmin(user);
    const subscriber = isSubscriber(user);

    // Scoped conditions for non-admin
    const draftScope = admin
      ? undefined
      : eq(drafts.createdBy, user.userId);
    const convScope = admin
      ? undefined
      : eq(conversations.createdBy, user.userId);
    const brandScope = subscriber
      ? eq(brands.createdBy, user.userId)
      : undefined;

    // Total counts
    const [brandCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(brands)
      .where(brandScope);

    const [agentCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(agents);

    const [draftCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(drafts)
      .where(draftScope);

    const [conversationCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(conversations)
      .where(convScope);

    // Drafts by status
    const draftsByStatus = await db
      .select({
        status: drafts.status,
        count: sql<number>`count(*)::int`,
      })
      .from(drafts)
      .where(draftScope)
      .groupBy(drafts.status);

    // Drafts by brand
    const draftsByBrand = await db
      .select({
        brandName: brands.name,
        brandCode: brands.brandCode,
        count: sql<number>`count(*)::int`,
      })
      .from(drafts)
      .leftJoin(brands, eq(drafts.brandId, brands.id))
      .where(draftScope)
      .groupBy(brands.name, brands.brandCode)
      .orderBy(desc(sql`count(*)`))
      .limit(10);

    // Drafts by agent
    const draftsByAgent = await db
      .select({
        agentName: agents.name,
        agentIcon: agents.icon,
        agentCategory: agents.category,
        count: sql<number>`count(*)::int`,
      })
      .from(drafts)
      .leftJoin(agents, eq(drafts.agentId, agents.id))
      .where(draftScope)
      .groupBy(agents.name, agents.icon, agents.category)
      .orderBy(desc(sql`count(*)`))
      .limit(12);

    // Recent drafts
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
      .where(draftScope)
      .orderBy(desc(drafts.createdAt))
      .limit(5);

    // Daily drafts (last 7 days)
    const dailyConditions = [
      sql`${drafts.createdAt} > now() - interval '7 days'`,
    ];
    if (!admin) {
      dailyConditions.push(sql`${drafts.createdBy} = ${user.userId}`);
    }

    const dailyDrafts = await db
      .select({
        date: sql<string>`to_char(${drafts.createdAt}, 'MM/DD')`,
        count: sql<number>`count(*)::int`,
      })
      .from(drafts)
      .where(and(...dailyConditions))
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
