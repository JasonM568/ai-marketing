import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { replySuggestions, incomingComments } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { getAuthUser } from "@/lib/auth";
import { generateReplyWithAI, deductCommentReplyCredit } from "@/lib/comment-reply";

// GET: List reply suggestions (pending/all)
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "請先登入" }, { status: 401 });

    const brandId = request.nextUrl.searchParams.get("brandId");
    const status = request.nextUrl.searchParams.get("status");

    const conditions = [];
    if (brandId) conditions.push(eq(replySuggestions.brandId, brandId));
    if (status) conditions.push(eq(replySuggestions.status, status));

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const suggestions = await db
      .select()
      .from(replySuggestions)
      .where(whereClause)
      .orderBy(desc(replySuggestions.createdAt))
      .limit(50);

    return NextResponse.json({ suggestions });
  } catch (error) {
    console.error("List replies error:", error);
    return NextResponse.json({ error: "取得回覆列表失敗" }, { status: 500 });
  }
}

// POST: Manually trigger AI reply generation for a specific comment
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "請先登入" }, { status: 401 });

    const body = await request.json();
    const { commentId } = body;

    if (!commentId) {
      return NextResponse.json({ error: "缺少 commentId" }, { status: 400 });
    }

    // Get the comment
    const [comment] = await db
      .select()
      .from(incomingComments)
      .where(eq(incomingComments.id, commentId))
      .limit(1);

    if (!comment) {
      return NextResponse.json({ error: "留言不存在" }, { status: 404 });
    }

    // Deduct credit (admin 不扣點)
    const deducted = await deductCommentReplyCredit(user.userId, comment.brandId, user.role);
    if (!deducted) {
      return NextResponse.json({ error: "點數不足" }, { status: 403 });
    }

    // Generate AI reply
    const suggestedText = await generateReplyWithAI(
      comment.commentText,
      comment.brandId
    );

    // Save suggestion
    const [suggestion] = await db
      .insert(replySuggestions)
      .values({
        commentId: comment.id,
        brandId: comment.brandId,
        suggestedText,
        status: "pending",
      })
      .returning();

    // Update comment status
    await db
      .update(incomingComments)
      .set({ status: "processing" })
      .where(eq(incomingComments.id, commentId));

    return NextResponse.json({ suggestion }, { status: 201 });
  } catch (error) {
    console.error("Generate reply error:", error);
    return NextResponse.json({ error: "生成回覆失敗" }, { status: 500 });
  }
}
