import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { brands, agents, conversations, userCredits, creditUsage, creditTransactions } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import Anthropic from "@anthropic-ai/sdk";
import { getAuthUser, isSubscriber } from "@/lib/auth";
import { getCreditsForAgent, getCreditsForFollowup } from "@/lib/plans";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "請先登入" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const body = await request.json();
    const { brandId, agentId, conversationId, messages } = body;

    if (!messages || messages.length === 0) {
      return new Response(JSON.stringify({ error: "請輸入訊息" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Fetch brand data
    let brandData = null;
    if (brandId) {
      const [brand] = await db
        .select()
        .from(brands)
        .where(eq(brands.id, brandId))
        .limit(1);
      brandData = brand;

      // Subscriber: can only use own brands
      if (isSubscriber(user) && brand && brand.createdBy !== user.userId) {
        return new Response(JSON.stringify({ error: "權限不足：只能使用自己的品牌" }), {
          status: 403,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    // Fetch agent data
    let agentData = null;
    if (agentId) {
      const [agent] = await db
        .select()
        .from(agents)
        .where(eq(agents.id, agentId))
        .limit(1);
      agentData = agent;
    }

    // ===== Subscriber credit check =====
    let creditCost = 0;
    let contentType = "social_post";

    if (isSubscriber(user)) {
      // Determine cost
      if (conversationId) {
        // Follow-up in existing conversation
        const result = getCreditsForFollowup();
        creditCost = result.credits;
        contentType = result.contentType;
      } else if (agentData) {
        const result = getCreditsForAgent(agentData.agentCode, agentData.category);
        creditCost = result.credits;
        contentType = result.contentType;
      } else {
        creditCost = 1;
        contentType = "social_post";
      }

      // Check balance
      const [credits] = await db
        .select()
        .from(userCredits)
        .where(eq(userCredits.userId, user.userId))
        .limit(1);

      if (!credits || credits.balance < creditCost) {
        return new Response(
          JSON.stringify({
            error: `點數不足：需要 ${creditCost} 點，目前剩餘 ${credits?.balance || 0} 點`,
          }),
          { status: 403, headers: { "Content-Type": "application/json" } }
        );
      }
    }

    // Build system prompt
    let systemPrompt = agentData?.systemPrompt || "你是一位專業的行銷內容助手。";

    if (brandData) {
      systemPrompt += `\n\n## 當前服務品牌：${brandData.name}`;
      systemPrompt += `\n**產業：** ${brandData.industry || "未設定"}`;

      if (brandData.brandVoice)
        systemPrompt += `\n\n### 品牌聲音\n${brandData.brandVoice}`;
      if (brandData.icp)
        systemPrompt += `\n\n### 目標受眾\n${brandData.icp}`;
      if (brandData.services)
        systemPrompt += `\n\n### 產品服務\n${brandData.services}`;
      if (brandData.contentPillars)
        systemPrompt += `\n\n### 內容策略\n${brandData.contentPillars}`;
      if (brandData.pastHits)
        systemPrompt += `\n\n### 高成效參考\n${brandData.pastHits}`;
      if (brandData.brandStory)
        systemPrompt += `\n\n### 品牌故事\n${brandData.brandStory}`;
    }

    const today = new Date().toLocaleDateString("zh-TW", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    systemPrompt += `\n\n**今天日期：${today}**`;
    systemPrompt += `\n\n## 重要提醒`;
    systemPrompt += `\n- 所有產出必須符合品牌聲音和風格`;
    systemPrompt += `\n- 使用繁體中文`;
    systemPrompt += `\n- 提供可直接使用的完整內容`;

    // Call Claude API with streaming
    const stream = await anthropic.messages.stream({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      system: systemPrompt,
      messages: messages.map((m: { role: string; content: string }) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
    });

    // Save or update conversation
    let activeConversationId = conversationId;
    if (!conversationId) {
      const userMessage = messages[messages.length - 1]?.content || "";
      const title =
        userMessage.slice(0, 50) + (userMessage.length > 50 ? "..." : "");
      try {
        const [newConv] = await db.insert(conversations)
          .values({
            brandId: brandId || null,
            agentId: agentId || null,
            createdBy: user.userId,
            title,
            messages: messages,
            status: "active",
          })
          .returning();
        activeConversationId = newConv.id;
      } catch (err) {
        console.error("Save conversation error:", err);
      }
    }

    // ===== Deduct credits for subscriber =====
    if (isSubscriber(user) && creditCost > 0) {
      try {
        // Atomic decrement
        await db
          .update(userCredits)
          .set({
            balance: sql`${userCredits.balance} - ${creditCost}`,
            updatedAt: new Date(),
          })
          .where(eq(userCredits.userId, user.userId));

        // Get new balance
        const [newCredits] = await db
          .select({ balance: userCredits.balance })
          .from(userCredits)
          .where(eq(userCredits.userId, user.userId))
          .limit(1);

        // Log usage
        await db.insert(creditUsage).values({
          userId: user.userId,
          agentId: agentId || null,
          brandId: brandId || null,
          conversationId: activeConversationId || null,
          creditsUsed: creditCost,
          contentType,
          description: `${agentData?.name || "AI 助手"} — ${contentType}`,
        });

        // Log transaction
        await db.insert(creditTransactions).values({
          userId: user.userId,
          type: "usage",
          amount: -creditCost,
          balanceAfter: newCredits?.balance || 0,
          description: `使用 ${agentData?.name || "AI 助手"}（${creditCost} 點）`,
        });
      } catch (err) {
        console.error("Credit deduction error:", err);
        // Don't block the response, log for manual reconciliation
      }
    }

    // Return SSE stream
    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          // Send conversationId + credit info to frontend
          const metaData: Record<string, unknown> = {};
          if (activeConversationId) metaData.conversationId = activeConversationId;
          if (isSubscriber(user)) metaData.creditsUsed = creditCost;

          if (Object.keys(metaData).length > 0) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(metaData)}\n\n`));
          }

          for await (const event of stream) {
            if (
              event.type === "content_block_delta" &&
              event.delta.type === "text_delta"
            ) {
              const data = JSON.stringify({ text: event.delta.text });
              controller.enqueue(encoder.encode(`data: ${data}\n\n`));
            }
          }
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        } catch (error) {
          console.error("Stream error:", error);
          controller.error(error);
        }
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Chat error:", error);
    return new Response(JSON.stringify({ error: "對話發生錯誤，請稍後再試" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
