import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { db } from "@/lib/db";
import { socialAccounts } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

/**
 * Meta Data Deletion Callback
 *
 * When a user removes our app from their Facebook settings,
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

    // Decode the payload
    const data = JSON.parse(
      Buffer.from(payload.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8")
    );

    // Verify the signature
    const expectedSig = crypto
      .createHmac("sha256", appSecret)
      .update(payload)
      .digest("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");

    if (encodedSig !== expectedSig) {
      console.error("Data deletion: invalid signature");
      return null;
    }

    return data;
  } catch (error) {
    console.error("Data deletion: failed to parse signed request", error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const signedRequest = formData.get("signed_request") as string;

    if (!signedRequest) {
      return NextResponse.json({ error: "Missing signed_request" }, { status: 400 });
    }

    const appSecret = process.env.META_APP_SECRET;
    if (!appSecret) {
      console.error("Data deletion: META_APP_SECRET not set");
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }

    const data = parseSignedRequest(signedRequest, appSecret);
    if (!data || !data.user_id) {
      return NextResponse.json({ error: "Invalid signed request" }, { status: 400 });
    }

    const metaUserId = data.user_id;

    // Delete all social accounts associated with this Meta user
    const deleted = await db
      .delete(socialAccounts)
      .where(eq(socialAccounts.metaUserId, metaUserId))
      .returning({ id: socialAccounts.id });

    console.log(`Data deletion: removed ${deleted.length} accounts for Meta user ${metaUserId}`);

    // Generate a confirmation code
    const confirmationCode = crypto.randomBytes(16).toString("hex");

    // Meta expects a JSON response with a URL and confirmation code
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://ai-marketing.huibang.com.tw";

    return NextResponse.json({
      url: `${baseUrl}/data-deletion?code=${confirmationCode}`,
      confirmation_code: confirmationCode,
    });
  } catch (error) {
    console.error("Data deletion callback error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
