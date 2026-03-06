import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { socialAccounts } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getAuthUser } from "@/lib/auth";
import { refreshToken } from "@/lib/meta";
import { encrypt, decrypt } from "@/lib/crypto";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "請先登入" }, { status: 401 });
    }

    const { id } = await params;
    const [account] = await db.select().from(socialAccounts).where(eq(socialAccounts.id, id));
    if (!account) {
      return NextResponse.json({ error: "帳號不存在" }, { status: 404 });
    }

    const currentToken = decrypt(account.accessToken);
    const { token: newToken, expiresIn } = await refreshToken(currentToken);
    const newExpiresAt = new Date(Date.now() + expiresIn * 1000);

    await db
      .update(socialAccounts)
      .set({
        accessToken: encrypt(newToken),
        tokenExpiresAt: newExpiresAt,
        status: "active",
        updatedAt: new Date(),
      })
      .where(eq(socialAccounts.id, id));

    return NextResponse.json({ success: true, expiresAt: newExpiresAt });
  } catch (error) {
    console.error("Refresh token error:", error);
    return NextResponse.json({ error: "Token 刷新失敗" }, { status: 500 });
  }
}
