import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { db } from "@/lib/db";
import { socialAccounts } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

/**
 * Threads Data Deletion Callback
 *
 * When a user requests data deletion for our app via Threads/Meta,
 * Meta sends a signed request to this endpoint.
 * We must delete all data associated with that user and return
 * a confirmation URL and code.
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
      console.error("[Threads DataDeletion] Invalid signature");
      return null;
    }

    return data;
  } catch (error) {
    console.error("[Threads DataDeletion] Failed to parse signed request:", error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const signedRequest = formData.get("signed_request") as string;

    if (!signedRequest) {
      console.error("[Threads DataDeletion] Missing signed_request");
      return NextResponse.json({ error: "Missing signed_request" }, { status: 400 });
    }

    // Use Threads App Secret (falls back to Meta App Secret)
    const appSecret = process.env.THREADS_APP_SECRET || process.env.META_APP_SECRET;
    if (!appSecret) {
      console.error("[Threads DataDeletion] THREADS_APP_SECRET not set");
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }

    const data = parseSignedRequest(signedRequest, appSecret);
    if (!data || !data.user_id) {
      return NextResponse.json({ error: "Invalid signed request" }, { status: 400 });
    }

    const threadsUserId = String(data.user_id);

    // Delete all Threads social accounts for this user
    const deleted = await db
      .delete(socialAccounts)
      .where(
        and(
          eq(socialAccounts.platformUserId, threadsUserId),
          eq(socialAccounts.platform, "threads")
        )
      )
      .returning({ id: socialAccounts.id });

    console.log(
      `[Threads DataDeletion] Deleted ${deleted.length} accounts for Threads user ${threadsUserId}`
    );

    // Generate confirmation code
    const confirmationCode = crypto.randomBytes(16).toString("hex");
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://ai-marketing.huibang.com.tw";

    // Meta expects a JSON response with status URL and confirmation code
    return NextResponse.json({
      url: `${baseUrl}/data-deletion?code=${confirmationCode}`,
      confirmation_code: confirmationCode,
    });
  } catch (error) {
    console.error("[Threads DataDeletion] Unexpected error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Status check endpoint — Meta may query this to verify deletion status
export async function GET() {
  return NextResponse.json({ success: true });
}
