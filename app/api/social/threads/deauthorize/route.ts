import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { db } from "@/lib/db";
import { socialAccounts } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

/**
 * Threads Deauthorize Callback
 *
 * When a user removes our app from their Threads settings,
 * Meta sends a signed request to this endpoint.
 * We deactivate all Threads accounts associated with that user.
 *
 * See: https://developers.facebook.com/docs/development/create-an-app/app-dashboard/data-deletion-callback/
 */

function parseSignedRequest(signedRequest: string, appSecret: string): any | null {
  try {
    const [encodedSig, payload] = signedRequest.split(".");
    if (!encodedSig || !payload) return null;

    const data = JSON.parse(
      Buffer.from(payload.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8")
    );

    const expectedSig = crypto
      .createHmac("sha256", appSecret)
      .update(payload)
      .digest("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");

    if (encodedSig !== expectedSig) {
      console.error("[Threads Deauthorize] Invalid signature");
      return null;
    }

    return data;
  } catch (error) {
    console.error("[Threads Deauthorize] Failed to parse signed request:", error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const signedRequest = formData.get("signed_request") as string;

    if (!signedRequest) {
      console.error("[Threads Deauthorize] Missing signed_request");
      return NextResponse.json({ error: "Missing signed_request" }, { status: 400 });
    }

    // Use Threads App Secret (falls back to Meta App Secret)
    const appSecret = process.env.THREADS_APP_SECRET || process.env.META_APP_SECRET;
    if (!appSecret) {
      console.error("[Threads Deauthorize] THREADS_APP_SECRET not set");
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }

    const data = parseSignedRequest(signedRequest, appSecret);
    if (!data || !data.user_id) {
      return NextResponse.json({ error: "Invalid signed request" }, { status: 400 });
    }

    const threadsUserId = String(data.user_id);

    // Deactivate all Threads accounts for this user
    const updated = await db
      .update(socialAccounts)
      .set({ status: "disconnected", updatedAt: new Date() })
      .where(
        and(
          eq(socialAccounts.platformUserId, threadsUserId),
          eq(socialAccounts.platform, "threads")
        )
      )
      .returning({ id: socialAccounts.id });

    console.log(
      `[Threads Deauthorize] Deactivated ${updated.length} accounts for Threads user ${threadsUserId}`
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Threads Deauthorize] Unexpected error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Meta may also send a GET for verification
export async function GET() {
  return NextResponse.json({ success: true });
}
