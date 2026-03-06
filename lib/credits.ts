/**
 * 共用點數邏輯 — 供 admin 手動指派 & ECPay 自動續費使用
 */
import { db } from "@/lib/db";
import { userCredits, creditTransactions, adminUsers } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { PLANS } from "@/lib/plans";

// ===== 指派方案點數 =====
export async function assignPlanCredits(opts: {
  userId: string;
  planId: string;
  assignedBy: string;
  description?: string;
}): Promise<{ success: boolean; balance: number }> {
  const plan = PLANS[opts.planId];
  if (!plan) throw new Error(`無效的方案 ID: ${opts.planId}`);

  const now = new Date();
  const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());

  // Update user's plan
  await db
    .update(adminUsers)
    .set({ planId: opts.planId, role: "subscriber" })
    .where(eq(adminUsers.id, opts.userId));

  const [existing] = await db
    .select()
    .from(userCredits)
    .where(eq(userCredits.userId, opts.userId))
    .limit(1);

  let newBalance: number;

  if (existing) {
    const maxCarry = plan.monthlyCredits * 2;
    const newCarryOver = Math.min(existing.balance, maxCarry);
    newBalance = newCarryOver + plan.monthlyCredits;

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
      .where(eq(userCredits.userId, opts.userId));
  } else {
    newBalance = plan.monthlyCredits;
    await db.insert(userCredits).values({
      userId: opts.userId,
      balance: newBalance,
      monthlyQuota: plan.monthlyCredits,
      carryOver: 0,
      maxBrands: plan.maxBrands,
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
    });
  }

  // Log transaction
  await db.insert(creditTransactions).values({
    userId: opts.userId,
    type: "plan_assign",
    amount: plan.monthlyCredits,
    balanceAfter: newBalance,
    description: opts.description || `指派方案：${plan.name}（${plan.monthlyCredits} 點/月）`,
    createdBy: opts.assignedBy,
  });

  return { success: true, balance: newBalance };
}

// ===== 月度重置點數（每月定期扣款成功後呼叫）=====
export async function resetMonthlyCredits(opts: {
  userId: string;
  planId: string;
  description?: string;
}): Promise<{ success: boolean; balance: number }> {
  const plan = PLANS[opts.planId];
  if (!plan) throw new Error(`無效的方案 ID: ${opts.planId}`);

  const now = new Date();
  const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());

  const [existing] = await db
    .select()
    .from(userCredits)
    .where(eq(userCredits.userId, opts.userId))
    .limit(1);

  if (!existing) {
    throw new Error(`用戶 ${opts.userId} 尚無點數紀錄`);
  }

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
    .where(eq(userCredits.userId, opts.userId));

  await db.insert(creditTransactions).values({
    userId: opts.userId,
    type: "plan_assign",
    amount: plan.monthlyCredits,
    balanceAfter: newBalance,
    description: opts.description || `月度續費重置：${plan.name}（${plan.monthlyCredits} 點）`,
    createdBy: "system",
  });

  return { success: true, balance: newBalance };
}
