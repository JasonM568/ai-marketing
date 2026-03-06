import Anthropic from "@anthropic-ai/sdk";
import { db } from "@/lib/db";
import { brands, socialAccounts, incomingComments, replySuggestions, userCredits, creditUsage, creditTransactions } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import { decrypt } from "@/lib/crypto";
import { replyToFacebookComment, replyToInstagramComment } from "@/lib/meta";
import { replyToThreadsComment } from "@/lib/threads";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// ===== AI Reply Generation =====

export async function generateReplyWithAI(
  commentText: string,
  brandId: string
): Promise<string> {
  // Fetch brand data for context
  const [brand] = await db
    .select()
    .from(brands)
    .where(eq(brands.id, brandId))
    .limit(1);

  if (!brand) throw new Error("品牌不存在");

  // Build system prompt with brand context
  const systemPrompt = buildReplySystemPrompt(brand);

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 300,
    system: systemPrompt,
    messages: [
      {
        role: "user",
        content: `請回覆以下社群留言：\n\n「${commentText}」`,
      },
    ],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  return textBlock?.text || "感謝您的留言！";
}

function buildReplySystemPrompt(brand: any): string {
  let prompt = `你是品牌「${brand.name}」的社群小編 AI 助手。請用品牌語氣回覆社群留言。

回覆要求：
- 繁體中文
- 100 字以內
- 語氣友善、專業
- 直接回覆，不要加引號或前綴
- 如果留言是負面的，保持同理心並引導至私訊
- 如果留言是正面的，表達感謝並互動`;

  if (brand.brandVoice) {
    prompt += `\n\n品牌語調：${brand.brandVoice}`;
  }
  if (brand.icp) {
    prompt += `\n\n目標客群（ICP）：${brand.icp}`;
  }
  if (brand.services) {
    prompt += `\n\n產品 / 服務：${brand.services}`;
  }

  return prompt;
}

// ===== Post Reply to Platform =====

export async function postReplyToPlatform(
  commentId: string,
  platform: string,
  socialAccountId: string,
  replyText: string
): Promise<string> {
  // Get the social account token
  const [account] = await db
    .select()
    .from(socialAccounts)
    .where(eq(socialAccounts.id, socialAccountId))
    .limit(1);

  if (!account) throw new Error("社群帳號不存在");

  const token = decrypt(account.accessToken);

  switch (platform) {
    case "facebook":
      // FB uses page token (stored in accessToken for page accounts)
      return await replyToFacebookComment(commentId, token, replyText);

    case "instagram":
      return await replyToInstagramComment(commentId, token, replyText);

    case "threads":
      // For Threads, commentId is the reply_to_id (the comment we're replying to)
      return await replyToThreadsComment("", commentId, replyText, token);

    default:
      throw new Error(`不支援的平台: ${platform}`);
  }
}

// ===== Credit Deduction for Comment Reply =====

export async function deductCommentReplyCredit(userId: string, brandId: string): Promise<boolean> {
  const [credits] = await db
    .select()
    .from(userCredits)
    .where(eq(userCredits.userId, userId))
    .limit(1);

  if (!credits || credits.balance < 1) return false;

  const newBalance = credits.balance - 1;

  await db
    .update(userCredits)
    .set({ balance: newBalance, updatedAt: new Date() })
    .where(eq(userCredits.userId, userId));

  await db.insert(creditUsage).values({
    userId,
    brandId,
    creditsUsed: 1,
    contentType: "comment_reply",
    description: "AI 留言回覆",
  });

  await db.insert(creditTransactions).values({
    userId,
    type: "usage",
    amount: -1,
    balanceAfter: newBalance,
    description: "AI 留言回覆",
  });

  return true;
}
