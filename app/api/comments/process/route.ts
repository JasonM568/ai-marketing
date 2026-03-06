import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { incomingComments, replySuggestions } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { getAuthUser } from "@/lib/auth";
import { generateReplyWithAI, deductCommentReplyCredit } from "@/lib/comment-reply";

// POST: Batch process new comments — generate AI replies
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "請先登入" }, { status: 401 });

    const body = await request.json();
    const { brandId, limit: maxComments } = body;

    if (!brandId) {
      return NextResponse.json({ error: "缺少 brandId" }, { status: 400 });
    }

    // Get new comments for this brand (max 10 per batch to stay within timeout)
    const batchSize = Math.min(maxComments || 10, 10);

    const newComments = await db
      .select()
      .from(incomingComments)
      .where(
        and(
          eq(incomingComments.brandId, brandId),
          eq(incomingComments.status, "new")
        )
      )
      .limit(batchSize);

    if (newComments.length === 0) {
      return NextResponse.json({ processed: 0, message: "沒有新留言需要處理" });
    }

    const results: { commentId: string; status: string; error?: string }[] = [];

    for (const comment of newComments) {
      try {
        // Deduct credit (admin 不扣點)
        const deducted = await deductCommentReplyCredit(user.userId, brandId, user.role);
        if (!deducted) {
          results.push({ commentId: comment.id, status: "skipped", error: "點數不足" });
          break; // Stop processing if out of credits
        }

        // Generate AI reply
        const suggestedText = await generateReplyWithAI(
          comment.commentText,
          brandId
        );

        // Save suggestion
        await db.insert(replySuggestions).values({
          commentId: comment.id,
          brandId,
          suggestedText,
          status: "pending",
        });

        // Update comment status
        await db
          .update(incomingComments)
          .set({ status: "processing" })
          .where(eq(incomingComments.id, comment.id));

        results.push({ commentId: comment.id, status: "generated" });
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "處理失敗";
        console.error(`Error processing comment ${comment.id}:`, err);

        // Mark as error
        await db
          .update(incomingComments)
          .set({ status: "error" })
          .where(eq(incomingComments.id, comment.id));

        results.push({ commentId: comment.id, status: "error", error: errorMsg });
      }
    }

    return NextResponse.json({
      processed: results.length,
      results,
    });
  } catch (error) {
    console.error("Batch process error:", error);
    return NextResponse.json({ error: "批次處理失敗" }, { status: 500 });
  }
}
