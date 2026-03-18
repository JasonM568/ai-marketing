import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { creditUsage, adminUsers } from "@/lib/db/schema";
import { sql, and, gte, lte } from "drizzle-orm";
import { getAuthUser, isAdmin } from "@/lib/auth";

// Pricing: claude-sonnet-4-20250514
// Input: $3 / 1M tokens, Output: $15 / 1M tokens
// 匯率：1 USD = 32 TWD
const INPUT_COST_PER_TOKEN = 3 / 1_000_000;
const OUTPUT_COST_PER_TOKEN = 15 / 1_000_000;
const USD_TO_TWD = 32;

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user || !isAdmin(user)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const year = parseInt(searchParams.get("year") || String(new Date().getFullYear()));
    const month = parseInt(searchParams.get("month") || String(new Date().getMonth() + 1));

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 1);

    // 各帳號 token 用量加總（從 creditUsage）
    const usageByUser = await db
      .select({
        userId: creditUsage.userId,
        totalInputTokens: sql<number>`coalesce(sum(${creditUsage.inputTokens}), 0)::int`,
        totalOutputTokens: sql<number>`coalesce(sum(${creditUsage.outputTokens}), 0)::int`,
        callCount: sql<number>`count(*)::int`,
      })
      .from(creditUsage)
      .where(
        and(
          gte(creditUsage.createdAt, startDate),
          lte(creditUsage.createdAt, endDate)
        )
      )
      .groupBy(creditUsage.userId);

    // 撈 adminUsers 的 email/name
    const users = await db.select().from(adminUsers);
    const userMap = Object.fromEntries(users.map((u) => [u.id, u]));

    const result = usageByUser.map((row) => {
      const u = userMap[row.userId];
      const costUsd =
        row.totalInputTokens * INPUT_COST_PER_TOKEN +
        row.totalOutputTokens * OUTPUT_COST_PER_TOKEN;
      return {
        userId: row.userId,
        email: u?.email || "未知帳號",
        name: u?.name || null,
        role: u?.role || "editor",
        callCount: row.callCount,
        inputTokens: row.totalInputTokens,
        outputTokens: row.totalOutputTokens,
        totalTokens: row.totalInputTokens + row.totalOutputTokens,
        costUsd: parseFloat(costUsd.toFixed(4)),
        costTwd: parseFloat((costUsd * USD_TO_TWD).toFixed(2)),
      };
    });

    const totalCostUsd = result.reduce((s, r) => s + r.costUsd, 0);

    return NextResponse.json({
      year,
      month,
      usdToTwd: USD_TO_TWD,
      summary: {
        totalCallCount: result.reduce((s, r) => s + r.callCount, 0),
        totalInputTokens: result.reduce((s, r) => s + r.inputTokens, 0),
        totalOutputTokens: result.reduce((s, r) => s + r.outputTokens, 0),
        totalCostUsd: parseFloat(totalCostUsd.toFixed(4)),
        totalCostTwd: parseFloat((totalCostUsd * USD_TO_TWD).toFixed(2)),
      },
      users: result.sort((a, b) => b.costTwd - a.costTwd),
    });
  } catch (error) {
    console.error("Usage API error:", error);
    return NextResponse.json({ error: "Failed to fetch usage" }, { status: 500 });
  }
}
