import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { db } from "@/lib/db";
import { commentMonitors, incomingComments } from "@/lib/db/schema";
import { eq, and, or, isNull } from "drizzle-orm";

// ===== GET: Meta Webhook Verification Challenge =====

export async function GET(request: NextRequest) {
  const mode = request.nextUrl.searchParams.get("hub.mode");
  const token = request.nextUrl.searchParams.get("hub.verify_token");
  const challenge = request.nextUrl.searchParams.get("hub.challenge");

  if (
    mode === "subscribe" &&
    token === process.env.META_WEBHOOK_VERIFY_TOKEN
  ) {
    console.log("Meta webhook verified");
    return new NextResponse(challenge, { status: 200 });
  }

  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

// ===== POST: Receive Webhook Events =====

export async function POST(request: NextRequest) {
  try {
    // 1. Verify X-Hub-Signature-256
    const signature = request.headers.get("x-hub-signature-256");
    const rawBody = await request.text();

    if (!verifySignature(rawBody, signature)) {
      console.error("Webhook signature verification failed");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const body = JSON.parse(rawBody);

    // 2. Process events based on object type
    if (body.object === "page") {
      // Facebook Page events (feed comments)
      await processFacebookEvents(body.entry || []);
    } else if (body.object === "instagram") {
      // Instagram events (comments)
      await processInstagramEvents(body.entry || []);
    } else if (body.object === "threads") {
      // Threads events (replies/comments)
      await processThreadsEvents(body.entry || []);
    }

    // 3. Always respond 200 quickly (Meta requires fast response)
    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    console.error("Webhook processing error:", error);
    // Still return 200 to prevent Meta from retrying
    return NextResponse.json({ received: true }, { status: 200 });
  }
}

// ===== Signature Verification =====

function verifySignature(
  rawBody: string,
  signature: string | null
): boolean {
  const appSecret = process.env.META_APP_SECRET;
  if (!appSecret) {
    console.error("META_APP_SECRET not set, skipping verification");
    return false;
  }

  if (!signature) return false;

  const expectedSig =
    "sha256=" +
    crypto
      .createHmac("sha256", appSecret)
      .update(rawBody, "utf-8")
      .digest("hex");

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSig)
  );
}

// ===== Facebook Page Comment Processing =====

async function processFacebookEvents(entries: any[]) {
  for (const entry of entries) {
    const pageId = entry.id;
    const changes = entry.changes || [];

    for (const change of changes) {
      if (change.field !== "feed") continue;
      const value = change.value;

      // Only process new comments (not reactions, posts, etc.)
      if (value.item !== "comment") continue;
      // Only process "add" verb (new comments, not edits/removes)
      if (value.verb !== "add") continue;

      const commentId = value.comment_id;
      const postId = value.post_id;
      const message = value.message;
      const senderName = value.sender_name;
      const senderId = value.sender_id;
      const parentId = value.parent_id;
      const createdTime = value.created_time
        ? new Date(value.created_time * 1000)
        : new Date();

      if (!commentId || !postId || !message) continue;

      // Find matching active monitors for this page/post
      const monitors = await findMatchingMonitors(
        "facebook",
        pageId,
        postId
      );

      if (monitors.length === 0) continue;

      // Insert incoming comment (deduplicate by platform_comment_id)
      try {
        await db
          .insert(incomingComments)
          .values({
            monitorId: monitors[0].id,
            brandId: monitors[0].brandId,
            platform: "facebook",
            platformCommentId: commentId,
            platformPostId: postId,
            parentCommentId: parentId || null,
            commenterName: senderName || null,
            commenterId: senderId || null,
            commentText: message,
            commentTimestamp: createdTime,
            status: "new",
          })
          .onConflictDoNothing();
      } catch (err) {
        console.error("Error inserting FB comment:", err);
      }
    }
  }
}

// ===== Instagram Comment Processing =====

async function processInstagramEvents(entries: any[]) {
  for (const entry of entries) {
    const igUserId = entry.id;
    const changes = entry.changes || [];

    for (const change of changes) {
      if (change.field !== "comments") continue;
      const value = change.value;

      const commentId = value.id;
      const mediaId = value.media?.id;
      const text = value.text;
      const fromUsername = value.from?.username;
      const fromId = value.from?.id;
      const parentId = value.parent_id;
      const timestamp = value.timestamp
        ? new Date(value.timestamp)
        : new Date();

      if (!commentId || !mediaId || !text) continue;

      // Find matching monitors
      const monitors = await findMatchingMonitors(
        "instagram",
        igUserId,
        mediaId
      );

      if (monitors.length === 0) continue;

      try {
        await db
          .insert(incomingComments)
          .values({
            monitorId: monitors[0].id,
            brandId: monitors[0].brandId,
            platform: "instagram",
            platformCommentId: commentId,
            platformPostId: mediaId,
            parentCommentId: parentId || null,
            commenterName: fromUsername || null,
            commenterId: fromId || null,
            commentText: text,
            commentTimestamp: timestamp,
            status: "new",
          })
          .onConflictDoNothing();
      } catch (err) {
        console.error("Error inserting IG comment:", err);
      }
    }
  }
}

// ===== Threads Comment Processing =====

async function processThreadsEvents(entries: any[]) {
  for (const entry of entries) {
    const threadsUserId = entry.id;
    const changes = entry.changes || [];

    for (const change of changes) {
      // Threads uses "replies" field for comment notifications
      if (change.field !== "replies") continue;
      const value = change.value;

      const commentId = value.id;
      const text = value.text;
      const fromUsername = value.username;
      const fromId = value.from?.id;
      const parentId = value.replied_to?.id;
      const mediaId = value.media_id || parentId; // root post ID
      const timestamp = value.timestamp
        ? new Date(value.timestamp)
        : new Date();

      if (!commentId || !text) continue;

      // Find matching monitors
      const monitors = await findMatchingMonitors(
        "threads",
        threadsUserId,
        mediaId || ""
      );

      if (monitors.length === 0) continue;

      try {
        await db
          .insert(incomingComments)
          .values({
            monitorId: monitors[0].id,
            brandId: monitors[0].brandId,
            platform: "threads",
            platformCommentId: commentId,
            platformPostId: mediaId || "",
            parentCommentId: parentId || null,
            commenterName: fromUsername || null,
            commenterId: fromId || null,
            commentText: text,
            commentTimestamp: timestamp,
            status: "new",
          })
          .onConflictDoNothing();
      } catch (err) {
        console.error("Error inserting Threads comment:", err);
      }
    }
  }
}

// ===== Helper: Find Matching Monitors =====

async function findMatchingMonitors(
  platform: string,
  accountPlatformId: string,
  postId: string
) {
  // Match monitors that:
  // 1. Are active
  // 2. Match the platform
  // 3. Either monitor "all" posts OR specifically monitor this post ID
  const monitors = await db
    .select()
    .from(commentMonitors)
    .where(
      and(
        eq(commentMonitors.platform, platform),
        eq(commentMonitors.status, "active"),
        or(
          // "all" mode: publishedPostId is NULL
          and(
            eq(commentMonitors.monitorMode, "all"),
            isNull(commentMonitors.publishedPostId)
          ),
          // "specific" mode: match exact post ID
          eq(commentMonitors.publishedPostId, postId)
        )
      )
    );

  return monitors;
}
