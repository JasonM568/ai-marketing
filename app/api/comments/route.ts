import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { incomingComments, replySuggestions } from "@/lib/db/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import { getAuthUser } from "@/lib/auth";

// GET: List incoming comments with pagination + filters
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "請先登入" }, { status: 401 });

    const brandId = request.nextUrl.searchParams.get("brandId");
    const status = request.nextUrl.searchParams.get("status"); // 'new' | 'processing' | 'replied' | 'ignored'
    const page = parseInt(request.nextUrl.searchParams.get("page") || "1");
    const limit = parseInt(request.nextUrl.searchParams.get("limit") || "20");
    const offset = (page - 1) * limit;

    // Build conditions
    const conditions = [];
    if (brandId) conditions.push(eq(incomingComments.brandId, brandId));
    if (status) conditions.push(eq(incomingComments.status, status));

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const comments = await db
      .select()
      .from(incomingComments)
      .where(whereClause)
      .orderBy(desc(incomingComments.createdAt))
      .limit(limit)
      .offset(offset);

    // Get total count
    const [countResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(incomingComments)
      .where(whereClause);

    // For each comment, fetch its reply suggestion (if any)
    const commentsWithReplies = await Promise.all(
      comments.map(async (comment) => {
        const suggestions = await db
          .select()
          .from(replySuggestions)
          .where(eq(replySuggestions.commentId, comment.id))
          .orderBy(desc(replySuggestions.createdAt))
          .limit(1);

        return {
          ...comment,
          replySuggestion: suggestions[0] || null,
        };
      })
    );

    return NextResponse.json({
      comments: commentsWithReplies,
      total: countResult?.count || 0,
      page,
      limit,
    });
  } catch (error) {
    console.error("List comments error:", error);
    return NextResponse.json({ error: "取得留言列表失敗" }, { status: 500 });
  }
}
