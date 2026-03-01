import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { userCredits, creditUsage, creditTransactions, adminUsers } from "@/lib/db/schema";
import { eq, desc, and, sql, gte } from "drizzle-orm";
import { getAuthUser, isAdmin, isSubscriber } from "@/lib/auth";
import { PLANS } from "@/lib/plans";

// GET /api/credits — get own balance + recent usage (subscriber) or any user (admin)
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const targetUserId = searchParams.get("userId") || user.userId;

    // Non-admin can only view own credits
    if (!isAdmin(user) && targetUserId !== user.userId) {
      return NextResponse.json({ error: "權限不足" }, { status: 403 });
    }

    // Get balance
    const [credits] = await db
      .select()
      .from(userCredits)
      .where(eq(userCredits.userId, targetUserId))
      .limit(1);

    // Get plan info from admin_users
    const [userInfo] = await db
      .select({ planId: adminUsers.planId, role: adminUsers.role })
      .from(adminUsers)
      .where(eq(adminUsers.id, targetUserId))
      .limit(1);

    const plan = userInfo?.planId ? PLANS[userInfo.planId] : null;

    // Get usage this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const monthlyUsage = await db
      .select({
        totalUsed: sql<number>`coalesce(sum(${creditUsage.creditsUsed}), 0)::int`,
        totalCount: sql<number>`count(*)::int`,
      })
      .from(creditUsage)
      .where(
        and(
          eq(creditUsage.userId, targetUserId),
          gte(creditUsage.createdAt, startOfMonth)
        )
      );

    // Get usage by content type this month
    const usageByType = await db
      .select({
        contentType: creditUsage.contentType,
        totalUsed: sql<number>`coalesce(sum(${creditUsage.creditsUsed}), 0)::int`,
        count: sql<number>`count(*)::int`,
      })
      .from(creditUsage)
      .where(
        and(
          eq(creditUsage.userId, targetUserId),
          gte(creditUsage.createdAt, startOfMonth)
        )
      )
      .groupBy(creditUsage.contentType);

    // Get daily usage (last 30 days)
    const dailyUsage = await db
      .select({
        date: sql<string>`to_char(${creditUsage.createdAt}, 'MM/DD')`,
        totalUsed: sql<number>`coalesce(sum(${creditUsage.creditsUsed}), 0)::int`,
        count: sql<number>`count(*)::int`,
      })
      .from(creditUsage)
      .where(
        and(
          eq(creditUsage.userId, targetUserId),
          gte(creditUsage.createdAt, sql`now() - interval '30 days'`)
        )
      )
      .groupBy(sql`to_char(${creditUsage.createdAt}, 'MM/DD')`)
      .orderBy(sql`to_char(${creditUsage.createdAt}, 'MM/DD')`);

    // Recent transactions
    const recentTransactions = await db
      .select()
      .from(creditTransactions)
      .where(eq(creditTransactions.userId, targetUserId))
      .orderBy(desc(creditTransactions.createdAt))
      .limit(20);

    return NextResponse.json({
      credits: credits || { balance: 0, monthlyQuota: 0, carryOver: 0, maxBrands: 1 },
      plan,
      monthlyUsage: monthlyUsage[0] || { totalUsed: 0, totalCount: 0 },
      usageByType,
      dailyUsage,
      recentTransactions,
    });
  } catch (error) {
    console.error("GET /api/credits error:", error);
    return NextResponse.json({ error: "取得點數資料失敗" }, { status: 500 });
  }
}

// POST /api/credits — admin: assign plan / grant credits / adjust
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user || !isAdmin(user)) {
      return NextResponse.json({ error: "權限不足" }, { status: 403 });
    }

    const body = await request.json();
    const { action, userId, planId, amount, description } = body;

    if (!userId) {
      return NextResponse.json({ error: "請指定用戶" }, { status: 400 });
    }

    if (action === "assign_plan") {
      // Assign subscription plan to user
      const plan = PLANS[planId];
      if (!plan) {
        return NextResponse.json({ error: "無效的方案" }, { status: 400 });
      }

      // Update user's plan
      await db
        .update(adminUsers)
        .set({ planId, role: "subscriber" })
        .where(eq(adminUsers.id, userId));

      // Create or update credits
      const now = new Date();
      const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());

      const [existing] = await db
        .select()
        .from(userCredits)
        .where(eq(userCredits.userId, userId))
        .limit(1);

      if (existing) {
        // Calculate carry over (max 2 months)
        const maxCarry = plan.monthlyCredits * 2;
        const newCarryOver = Math.min(existing.balance, maxCarry);
        const newBalance = newCarryOver + plan.monthlyCredits;

        await db
          .update(userCredits)
          .set({
            balance: newBalance,
            monthlyQuota: plan.monthlyCredits,
            carryOver: newCarryOver,
            maxBrands: plan.maxBrands,
            currentPeriodStart: now,
            currentPeriodEnd: periodEnd,
            updatedAt: now,
          })
          .where(eq(userCredits.userId, userId));

        // Log transaction
        await db.insert(creditTransactions).values({
          userId,
          type: "plan_assign",
          amount: plan.monthlyCredits,
          balanceAfter: newBalance,
          description: `指派方案：${plan.name}（${plan.monthlyCredits} 點/月）`,
          createdBy: user.userId,
        });
      } else {
        // First time
        const newBalance = plan.monthlyCredits;
        await db.insert(userCredits).values({
          userId,
          balance: newBalance,
          monthlyQuota: plan.monthlyCredits,
          carryOver: 0,
          maxBrands: plan.maxBrands,
          currentPeriodStart: now,
          currentPeriodEnd: periodEnd,
        });

        await db.insert(creditTransactions).values({
          userId,
          type: "plan_assign",
          amount: plan.monthlyCredits,
          balanceAfter: newBalance,
          description: `首次指派方案：${plan.name}（${plan.monthlyCredits} 點）`,
          createdBy: user.userId,
        });
      }

      return NextResponse.json({ success: true, message: `已指派 ${plan.name} 方案` });

    } else if (action === "adjust") {
      // Manual credit adjustment
      if (!amount || amount === 0) {
        return NextResponse.json({ error: "請輸入調整數量" }, { status: 400 });
      }

      const [existing] = await db
        .select()
        .from(userCredits)
        .where(eq(userCredits.userId, userId))
        .limit(1);

      if (!existing) {
        return NextResponse.json({ error: "該用戶尚未指派方案" }, { status: 400 });
      }

      const newBalance = Math.max(0, existing.balance + amount);

      await db
        .update(userCredits)
        .set({ balance: newBalance, updatedAt: new Date() })
        .where(eq(userCredits.userId, userId));

      await db.insert(creditTransactions).values({
        userId,
        type: amount > 0 ? "grant" : "deduct",
        amount,
        balanceAfter: newBalance,
        description: description || (amount > 0 ? `手動加點 ${amount} 點` : `手動扣除 ${Math.abs(amount)} 點`),
        createdBy: user.userId,
      });

      return NextResponse.json({ success: true, balance: newBalance });

    } else {
      return NextResponse.json({ error: "無效的操作" }, { status: 400 });
    }
  } catch (error) {
    console.error("POST /api/credits error:", error);
    return NextResponse.json({ error: "操作失敗" }, { status: 500 });
  }
}
