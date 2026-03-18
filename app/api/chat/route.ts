import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { brands, agents, conversations, userCredits, creditUsage, creditTransactions } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import Anthropic from "@anthropic-ai/sdk";
import { getAuthUser, isSubscriber } from "@/lib/auth";
import { canAccessBrand } from "@/lib/brand-access";
import { getCreditsForAgent, getCreditsForFollowup, calculateOverageCost, shouldWarnFollowupCharge, FREE_FOLLOWUPS } from "@/lib/plans";

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

      // Check brand access for all roles
      if (brand) {
        const hasAccess = await canAccessBrand(user, brand.id);
        if (!hasAccess) {
          return new Response(JSON.stringify({ error: "權限不足" }), {
            status: 403,
            headers: { "Content-Type": "application/json" },
          });
        }
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
    let isFollowupFree = false;
    let followupWarning = false;
    let currentFollowupCount = 0;
    const isSubUser = isSubscriber(user);

    if (isSubUser) {
      if (conversationId) {
        // Fetch current followup count from conversation
        const [conv] = await db
          .select({ followupCount: conversations.followupCount })
          .from(conversations)
          .where(eq(conversations.id, conversationId))
          .limit(1);
        currentFollowupCount = conv?.followupCount || 0;

        const result = getCreditsForFollowup(currentFollowupCount);
        baseCost = result.credits;
        contentType = result.contentType;
        tokenAllowance = result.tokenAllowance;
        isFollowupFree = result.isFree;

        // Check if we should warn user about upcoming charges
        followupWarning = shouldWarnFollowupCharge(currentFollowupCount);
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

      // Check balance (at least base cost) — skip check if free followup
      if (baseCost > 0) {
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

      // Inject reference file content
      try {
        const { brandFiles: brandFilesTable } = await import("@/lib/db/schema");
        const refFiles = await db
          .select({
            fileName: brandFilesTable.fileName,
            extractedText: brandFilesTable.extractedText,
          })
          .from(brandFilesTable)
          .where(eq(brandFilesTable.brandId, brandData.id));

        if (refFiles.length > 0) {
          systemPrompt += `\n\n### 參考資料`;
          for (const file of refFiles) {
            if (file.extractedText) {
              systemPrompt += `\n\n#### ${file.fileName}\n${file.extractedText}`;
            }
          }
        }
      } catch (err) {
        console.error("Failed to load brand files for context:", err);
      }
    }

    const today = new Date().toLocaleDateString("zh-TW", { year: "numeric", month: "long", day: "numeric" });
    systemPrompt += `\n\n**今天日期：${today}**`;
    systemPrompt += `\n\n## 重要提醒`;
    systemPrompt += `\n- 所有產出必須符合品牌聲音和風格`;
    systemPrompt += `\n- 使用繁體中文`;
    systemPrompt += `\n- 提供可直接使用的完整內容`;

    // Select model: Haiku for followups (cheaper), Sonnet for first generation
    const modelId = conversationId
      ? "claude-haiku-4-5-20251001"
      : "claude-sonnet-4-20250514";

    // Call Claude API with streaming
    const stream = await anthropic.messages.stream({
      model: modelId,
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
            followupCount: 0,
          })
          .returning();
        activeConversationId = newConv.id;
      } catch (err) {
        console.error("Save conversation error:", err);
      }
    } else {
      // Increment followup count for existing conversation
      try {
        await db
          .update(conversations)
          .set({
            followupCount: sql`${conversations.followupCount} + 1`,
            updatedAt: new Date(),
          })
          .where(eq(conversations.id, conversationId));
      } catch (err) {
        console.error("Update followup count error:", err);
      }
    }

    // Pricing: claude-sonnet-4-20250514
    // Input: $3 / 1M tokens, Output: $15 / 1M tokens
    const MODEL = "claude-sonnet-4-20250514";
    const INPUT_COST_PER_TOKEN = 3 / 1_000_000;
    const OUTPUT_COST_PER_TOKEN = 15 / 1_000_000;

    // Return SSE stream
    const encoder = new TextEncoder();

    const readable = new ReadableStream({
      async start(controller) {
        let inputTokens = 0;
        let outputTokens = 0;
        try {
          // Send conversationId + followup warning to frontend
          const metaData: Record<string, unknown> = {};
          if (activeConversationId) metaData.conversationId = activeConversationId;
          if (isSubUser) metaData.creditsUsed = baseCost;

          // Send followup warning when free quota is exhausted
          if (followupWarning) {
            metaData.followupWarning = `本次對話的 ${FREE_FOLLOWUPS} 次免費追問已用完，接下來每次追問將消耗 1 點`;
          }
          // Send free followup remaining info
          if (isFollowupFree && conversationId) {
            metaData.freeFollowup = true;
            metaData.freeFollowupsRemaining = FREE_FOLLOWUPS - currentFollowupCount - 1;
          }

          if (Object.keys(metaData).length > 0) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(metaData)}\n\n`));
          }

          // Stream response
          for await (const event of stream) {
            if (event.type === "message_start") {
              inputTokens = event.message.usage.input_tokens;
            }
            if (event.type === "message_delta" && event.usage) {
              outputTokens = event.usage.output_tokens;
            }
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
          inputTokens = finalMessage.usage?.input_tokens || inputTokens;
          outputTokens = finalMessage.usage?.output_tokens || outputTokens;
          const totalTokens = inputTokens + outputTokens;

          // ===== Non-subscriber: log token usage only (no credit deduction) =====
          if (!isSubUser) {
            try {
              await db.insert(creditUsage).values({
                userId: user.userId,
                agentId: agentId || null,
                brandId: brandId || null,
                conversationId: activeConversationId || null,
                creditsUsed: 0,
                contentType: agentData?.category === "strategy" ? "strategy" : "social_post",
                inputTokens,
                outputTokens,
                description: `${agentData?.name || "AI 助手"}（${totalTokens.toLocaleString()} tokens）`,
              });
            } catch (err) {
              console.error("Usage logging error:", err);
            }
          }

          // ===== Subscriber: calculate overage + log =====
          if (isSubUser) {
            try {
              // Free followups: no overage charge
              const overageCost = isFollowupFree ? 0 : calculateOverageCost(totalTokens, tokenAllowance);
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
              const usageDesc = isFollowupFree
                ? `${agentData?.name || "AI 助手"}（免費追問 ${currentFollowupCount + 1}/${FREE_FOLLOWUPS}）`
                : `${agentData?.name || "AI 助手"}（${totalTokens.toLocaleString()} tokens${overageCost > 0 ? `，超量 +${overageCost} 點` : ""}）`;

              await db.insert(creditUsage).values({
                userId: user.userId,
                agentId: agentId || null,
                brandId: brandId || null,
                conversationId: activeConversationId || null,
                creditsUsed: totalCost,
                contentType,
                inputTokens,
                outputTokens,
                description: usageDesc,
              });

              // Log transaction (only if credits were actually spent)
              if (totalCost > 0) {
                await db.insert(creditTransactions).values({
                  userId: user.userId,
                  type: "usage",
                  amount: -totalCost,
                  balanceAfter: finalCredits?.balance || 0,
                  description: `${agentData?.name || "AI 助手"}（基礎 ${baseCost}${overageCost > 0 ? ` + 超量 ${overageCost}` : ""} 點，${totalTokens.toLocaleString()} tokens）`,
                });
              }

              // Send final credit summary to frontend
              const creditInfo = JSON.stringify({
                creditSummary: {
                  baseCost,
                  overageCost,
                  totalCost,
                  totalTokens,
                  tokenAllowance,
                  remainingBalance: finalCredits?.balance || 0,
                  isFreeFollowup: isFollowupFree,
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
