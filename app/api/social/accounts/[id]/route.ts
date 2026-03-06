import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { socialAccounts } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getAuthUser } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "請先登入" }, { status: 401 });
    }

    const { id } = await params;
    const [account] = await db
      .select({
        id: socialAccounts.id,
        brandId: socialAccounts.brandId,
        platform: socialAccounts.platform,
        platformUsername: socialAccounts.platformUsername,
        platformUserId: socialAccounts.platformUserId,
        tokenExpiresAt: socialAccounts.tokenExpiresAt,
        status: socialAccounts.status,
        createdAt: socialAccounts.createdAt,
      })
      .from(socialAccounts)
      .where(eq(socialAccounts.id, id));

    if (!account) {
      return NextResponse.json({ error: "帳號不存在" }, { status: 404 });
    }

    return NextResponse.json(account);
  } catch (error) {
    console.error("Get social account error:", error);
    return NextResponse.json({ error: "查詢失敗" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "請先登入" }, { status: 401 });
    }

    const { id } = await params;
    await db
      .update(socialAccounts)
      .set({ status: "disconnected", updatedAt: new Date() })
      .where(eq(socialAccounts.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete social account error:", error);
    return NextResponse.json({ error: "斷開失敗" }, { status: 500 });
  }
}
