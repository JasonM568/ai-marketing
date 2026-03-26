import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { socialAccounts } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getAuthUser } from "@/lib/auth";
import { refreshToken } from "@/lib/meta";
import { encrypt, decrypt } from "@/lib/crypto";
import { canAccessBrand } from "@/lib/brand-access";

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

    // Verify brand access
    const hasAccess = await canAccessBrand(user, account.brandId);
    if (!hasAccess) {
      return NextResponse.json({ error: "權限不足" }, { status: 403 });
    }

    // Decrypt current token
    let currentToken: string;
    try {
      currentToken = decrypt(account.accessToken);
    } catch {
      return NextResponse.json(
        { error: "Token 解密失敗，請重新連結社群帳號" },
        { status: 400 }
      );
    }

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
