import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { socialAccounts } from "@/lib/db/schema";
import { eq, and, lte } from "drizzle-orm";
import { decrypt, encrypt } from "@/lib/crypto";
import { refreshToken } from "@/lib/meta";
import { refreshThreadsToken } from "@/lib/threads";

export async function GET(request: NextRequest) {
  try {
    // Verify CRON_SECRET
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Find active accounts with tokens expiring within 7 days
    const sevenDaysFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const expiringAccounts = await db
      .select()
      .from(socialAccounts)
      .where(
        and(
          eq(socialAccounts.status, "active"),
          lte(socialAccounts.tokenExpiresAt, sevenDaysFromNow)
        )
      );

    const results: { id: string; status: string; error?: string }[] = [];

    for (const account of expiringAccounts) {
      try {
        // Decrypt current token
        const currentToken = decrypt(account.accessToken);

        // Refresh the token (Threads uses a different API endpoint)
        const { token: newToken, expiresIn } = account.platform === "threads"
          ? await refreshThreadsToken(currentToken)
          : await refreshToken(currentToken);
        const newExpiresAt = new Date(Date.now() + expiresIn * 1000);

        // Encrypt and save new token
        await db
          .update(socialAccounts)
          .set({
            accessToken: encrypt(newToken),
            tokenExpiresAt: newExpiresAt,
            status: "active",
            updatedAt: new Date(),
          })
          .where(eq(socialAccounts.id, account.id));

        results.push({ id: account.id, status: "refreshed" });
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Unknown error";

        // Mark account as expired on failure
        await db
          .update(socialAccounts)
          .set({
            status: "expired",
            updatedAt: new Date(),
          })
          .where(eq(socialAccounts.id, account.id));

        results.push({ id: account.id, status: "expired", error: errorMessage });
      }
    }

    return NextResponse.json({
      processed: expiringAccounts.length,
      results,
    });
  } catch (error) {
    console.error("Token refresh cron error:", error);
    return NextResponse.json({ error: "Cron job failed" }, { status: 500 });
  }
}
