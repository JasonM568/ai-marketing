import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { replySuggestions, incomingComments, commentMonitors } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getAuthUser } from "@/lib/auth";
import { postReplyToPlatform } from "@/lib/comment-reply";

// PATCH: Approve / Edit / Reject a reply suggestion
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "請先登入" }, { status: 401 });

    const { id } = await params;
    const body = await request.json();
    const { action, editedText } = body;

    // Get the suggestion
    const [suggestion] = await db
      .select()
      .from(replySuggestions)
      .where(eq(replySuggestions.id, id))
      .limit(1);

    if (!suggestion) {
      return NextResponse.json({ error: "回覆建議不存在" }, { status: 404 });
    }

    switch (action) {
      case "approve": {
        // Use edited text if available, otherwise use suggested text
        const textToPost = suggestion.editedText || suggestion.suggestedText;

        // Get the comment to find the platform info
        const [comment] = await db
          .select()
          .from(incomingComments)
          .where(eq(incomingComments.id, suggestion.commentId))
          .limit(1);

        if (!comment) {
          return NextResponse.json({ error: "留言不存在" }, { status: 404 });
        }

        // Get the monitor to find the social account
        let socialAccountId: string | null = null;
        if (comment.monitorId) {
          const [monitor] = await db
            .select()
            .from(commentMonitors)
            .where(eq(commentMonitors.id, comment.monitorId))
            .limit(1);
          socialAccountId = monitor?.socialAccountId || null;
        }

        if (!socialAccountId) {
          return NextResponse.json({ error: "找不到社群帳號" }, { status: 400 });
        }

        // Post reply to platform
        let postedReplyId: string;
        try {
          postedReplyId = await postReplyToPlatform(
            comment.platformCommentId,
            comment.platform,
            socialAccountId,
            textToPost
          );
        } catch (err) {
          const errMsg = err instanceof Error ? err.message : "發送失敗";
          // Update suggestion status to error
          await db
            .update(replySuggestions)
            .set({ status: "pending", reviewedBy: user.userId, reviewedAt: new Date() })
            .where(eq(replySuggestions.id, id));

          return NextResponse.json({ error: `發送回覆失敗: ${errMsg}` }, { status: 500 });
        }

        // Update suggestion as posted
        const [updated] = await db
          .update(replySuggestions)
          .set({
            status: "posted",
            postedReplyId,
            postedAt: new Date(),
            reviewedBy: user.userId,
            reviewedAt: new Date(),
          })
          .where(eq(replySuggestions.id, id))
          .returning();

        // Update comment status
        await db
          .update(incomingComments)
          .set({ status: "replied" })
          .where(eq(incomingComments.id, suggestion.commentId));

        return NextResponse.json({ suggestion: updated });
      }

      case "edit": {
        if (!editedText) {
          return NextResponse.json({ error: "缺少 editedText" }, { status: 400 });
        }

        const [updated] = await db
          .update(replySuggestions)
          .set({
            editedText,
            status: "edited",
            reviewedBy: user.userId,
            reviewedAt: new Date(),
          })
          .where(eq(replySuggestions.id, id))
          .returning();

        return NextResponse.json({ suggestion: updated });
      }

      case "reject": {
        const [updated] = await db
          .update(replySuggestions)
          .set({
            status: "rejected",
            reviewedBy: user.userId,
            reviewedAt: new Date(),
          })
          .where(eq(replySuggestions.id, id))
          .returning();

        // Update comment status to ignored
        await db
          .update(incomingComments)
          .set({ status: "ignored" })
          .where(eq(incomingComments.id, suggestion.commentId));

        return NextResponse.json({ suggestion: updated });
      }

      default:
        return NextResponse.json({ error: "無效的 action" }, { status: 400 });
    }
  } catch (error) {
    console.error("Reply action error:", error);
    return NextResponse.json({ error: "操作失敗" }, { status: 500 });
  }
}
