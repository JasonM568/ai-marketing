/**
 * 品牌存取控制模組
 *
 * 角色存取規則：
 * - Admin:      所有品牌（return null 代表不需過濾）
 * - Master:     被指派的品牌（brand_members）+ 所有 Subscriber 建立的品牌
 * - Editor:     僅被指派的品牌（brand_members）
 * - Subscriber: 僅自己建立的品牌（brands.createdBy）
 */

import { db } from "@/lib/db";
import { brands, brandMembers, adminUsers } from "@/lib/db/schema";
import { eq, inArray, sql } from "drizzle-orm";

interface AuthUser {
  userId: string;
  email: string;
  role: "admin" | "master" | "editor" | "subscriber";
}

/**
 * 取得使用者可存取的品牌 ID 列表
 * @returns null = 全部品牌（Admin）, string[] = 可存取的品牌 ID
 */
export async function getAccessibleBrandIds(
  user: AuthUser
): Promise<string[] | null> {
  // Admin: 全部品牌
  if (user.role === "admin") {
    return null;
  }

  // Subscriber: 僅自己建立的
  if (user.role === "subscriber") {
    const ownBrands = await db
      .select({ id: brands.id })
      .from(brands)
      .where(eq(brands.createdBy, user.userId));
    return ownBrands.map((b) => b.id);
  }

  // Editor: 僅被指派的（透過 brand_members）
  if (user.role === "editor") {
    const assigned = await db
      .select({ brandId: brandMembers.brandId })
      .from(brandMembers)
      .where(eq(brandMembers.userId, user.userId));
    return assigned.map((m) => m.brandId);
  }

  // Master: 被指派的 + 所有 Subscriber 建立的
  if (user.role === "master") {
    const assigned = await db
      .select({ brandId: brandMembers.brandId })
      .from(brandMembers)
      .where(eq(brandMembers.userId, user.userId));
    const assignedIds = assigned.map((m) => m.brandId);

    const subscriberBrands = await db
      .select({ id: brands.id })
      .from(brands)
      .innerJoin(adminUsers, eq(brands.createdBy, adminUsers.id))
      .where(eq(adminUsers.role, "subscriber"));
    const subscriberIds = subscriberBrands.map((b) => b.id);

    return [...new Set([...assignedIds, ...subscriberIds])];
  }

  return []; // fallback
}

/**
 * 檢查使用者是否可存取特定品牌（單一品牌檢查，比載入全部 ID 更高效）
 */
export async function canAccessBrand(
  user: AuthUser,
  brandId: string
): Promise<boolean> {
  if (user.role === "admin") return true;

  if (user.role === "subscriber") {
    const [brand] = await db
      .select({ createdBy: brands.createdBy })
      .from(brands)
      .where(eq(brands.id, brandId))
      .limit(1);
    return brand?.createdBy === user.userId;
  }

  if (user.role === "editor") {
    const [membership] = await db
      .select({ id: brandMembers.id })
      .from(brandMembers)
      .where(
        sql`${brandMembers.brandId} = ${brandId} AND ${brandMembers.userId} = ${user.userId}`
      )
      .limit(1);
    return !!membership;
  }

  if (user.role === "master") {
    // 檢查直接指派
    const [membership] = await db
      .select({ id: brandMembers.id })
      .from(brandMembers)
      .where(
        sql`${brandMembers.brandId} = ${brandId} AND ${brandMembers.userId} = ${user.userId}`
      )
      .limit(1);
    if (membership) return true;

    // 檢查品牌是否由 Subscriber 建立
    const [brand] = await db
      .select({ createdBy: brands.createdBy })
      .from(brands)
      .where(eq(brands.id, brandId))
      .limit(1);
    if (!brand?.createdBy) return false;

    const [creator] = await db
      .select({ role: adminUsers.role })
      .from(adminUsers)
      .where(eq(adminUsers.id, brand.createdBy))
      .limit(1);
    return creator?.role === "subscriber";
  }

  return false;
}

/**
 * 產生 Drizzle WHERE 條件，用於列表端點的品牌範圍過濾
 * @param brandIdColumn - Drizzle column reference（如 scheduledPosts.brandId）
 * @returns undefined = 不需過濾（Admin）, SQL condition = 過濾條件
 */
export async function getBrandScopeCondition(
  user: AuthUser,
  brandIdColumn: any
) {
  const accessibleIds = await getAccessibleBrandIds(user);
  if (accessibleIds === null) return undefined; // Admin: 不過濾
  if (accessibleIds.length === 0) return sql`false`; // 無存取權
  return inArray(brandIdColumn, accessibleIds);
}
