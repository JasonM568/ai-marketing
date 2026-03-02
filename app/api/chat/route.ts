import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { brands, agents, conversations, userCredits, creditUsage, creditTransactions } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import Anthropic from "@anthropic-ai/sdk";
import { getAuthUser, isSubscriber } from "@/lib/auth";
import { getCreditsForAgent, getCreditsForFollowup, calculateOverageCost } from "@/lib/plans";

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

    // ===== Subscriber: determine base cost + token allowance =====
    let baseCost = 0;
    let contentType = "social_post";
    let tokenAllowance = 3000;
    const isSubUser = isSubscriber(user);

    if (isSubUser) {
      if (conversationId) {
        const result = getCreditsForFollowup();
        baseCost = result.credits;
        contentType = result.contentType;
        tokenAllowance = result.tokenAllowance;
      } else if (agentData) {
        const result = getCreditsForAgent(agentData.agentCode, agentData.category);
        baseCost = result.credits;
        contentType = result.contentType;
        tokenAllowance = result.tokenAllowance;
      } else {
        baseCost = 1;
        contentType = "social_post";
        tokenAllowance = 3000;
      }

      // Check balance (at least base cost)
      const [credits] = await db
        .select()
        .from(userCredits)
        .where(eq(userCredits.userId, user.userId))
        .limit(1);

      if (!credits || credits.balance < baseCost) {
        return new Response(
          JSON.stringify({
            error: `點數不足：需要至少 ${baseCost} 點，目前剩餘 ${credits?.balance || 0} 點`,
          }),
          { status: 403, headers: { "Content-Type": "application/json" } }
        );
      }

      // Deduct base cost immediately
      await db
        .update(userCredits)
        .set({
          balance: sql`${userCredits.balance} - ${baseCost}`,
          updatedAt: new Date(),
        })
        .where(eq(userCredits.userId, user.userId));
    }

    // Build system prompt
    let systemPrompt = agentData?.systemPrompt || "你是一位專業的行銷內容助手。";

    if (brandData) {
      systemPrompt += `\n\n## 當前服務品牌：${brandData.name}`;
      systemPrompt += `\n**產業：** ${brandData.industry || "未設定"}`;
      if (brandData.brandVoice) systemPrompt += `\n\n### 品牌聲音\n${brandData.brandVoice}`;
      if (brandData.icp) systemPrompt += `\n\n### 目標受眾\n${brandData.icp}`;
      if (brandData.services) systemPrompt += `\n\n### 產品服務\n${brandData.services}`;
      if (brandData.contentPillars) systemPrompt += `\n\n### 內容策略\n${brandData.contentPillars}`;
      if (brandData.pastHits) systemPrompt += `\n\n### 高成效參考\n${brandData.pastHits}`;
      if (brandData.brandStory) systemPrompt += `\n\n### 品牌故事\n${brandData.brandStory}`;
    }

    const today = new Date().toLocaleDateString("zh-TW", { year: "numeric", month: "long", day: "numeric" });
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
      const title = userMessage.slice(0, 50) + (userMessage.length > 50 ? "..." : "");
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

    // Return SSE stream
    const encoder = new TextEncoder();

    const readable = new ReadableStream({
      async start(controller) {
        try {
          // Send conversationId to frontend
          const metaData: Record<string, unknown> = {};
          if (activeConversationId) metaData.conversationId = activeConversationId;
          if (isSubUser) metaData.creditsUsed = baseCost;

          if (Object.keys(metaData).length > 0) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(metaData)}\n\n`));
          }

          // Stream response
          for await (const event of stream) {
            if (
              event.type === "content_block_delta" &&
              event.delta.type === "text_delta"
            ) {
              const data = JSON.stringify({ text: event.delta.text });
              controller.enqueue(encoder.encode(`data: ${data}\n\n`));
            }
          }

          // ===== After streaming: get final token usage =====
          const finalMessage = await stream.finalMessage();
          const inputTokens = finalMessage.usage?.input_tokens || 0;
          const outputTokens = finalMessage.usage?.output_tokens || 0;
          const totalTokens = inputTokens + outputTokens;

          // ===== Subscriber: calculate overage + log =====
          if (isSubUser) {
            try {
              const overageCost = calculateOverageCost(totalTokens, tokenAllowance);
              const totalCost = baseCost + overageCost;

              // Deduct overage if any
              if (overageCost > 0) {
                await db
                  .update(userCredits)
                  .set({
                    balance: sql`GREATEST(${userCredits.balance} - ${overageCost}, 0)`,
                    updatedAt: new Date(),
                  })
                  .where(eq(userCredits.userId, user.userId));
              }

              // Get final balance
              const [finalCredits] = await db
                .select({ balance: userCredits.balance })
                .from(userCredits)
                .where(eq(userCredits.userId, user.userId))
                .limit(1);

              // Log usage with actual token counts
              await db.insert(creditUsage).values({
                userId: user.userId,
                agentId: agentId || null,
                brandId: brandId || null,
                conversationId: activeConversationId || null,
                creditsUsed: totalCost,
                contentType,
                inputTokens,
                outputTokens,
                description: `${agentData?.name || "AI 助手"}（${totalTokens.toLocaleString()} tokens${overageCost > 0 ? `，超量 +${overageCost} 點` : ""}）`,
              });

              // Log transaction
              await db.insert(creditTransactions).values({
                userId: user.userId,
                type: "usage",
                amount: -totalCost,
                balanceAfter: finalCredits?.balance || 0,
                description: `${agentData?.name || "AI 助手"}（基礎 ${baseCost}${overageCost > 0 ? ` + 超量 ${overageCost}` : ""} 點，${totalTokens.toLocaleString()} tokens）`,
              });

              // Send final credit summary to frontend
              const creditInfo = JSON.stringify({
                creditSummary: {
                  baseCost,
                  overageCost,
                  totalCost,
                  totalTokens,
                  tokenAllowance,
                  remainingBalance: finalCredits?.balance || 0,
                },
              });
              controller.enqueue(encoder.encode(`data: ${creditInfo}\n\n`));
            } catch (err) {
              console.error("Credit logging error:", err);
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
