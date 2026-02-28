import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { brands, agents, conversations } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      brandId,
      agentId,
      conversationId,
      messages: userMessages,
    } = body;

    if (!brandId || !agentId || !userMessages?.length) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Fetch brand and agent data
    const [brand] = await db
      .select()
      .from(brands)
      .where(eq(brands.id, brandId))
      .limit(1);

    const [agent] = await db
      .select()
      .from(agents)
      .where(eq(agents.id, agentId))
      .limit(1);

    if (!brand || !agent) {
      return new Response(
        JSON.stringify({ error: "Brand or agent not found" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    // Build system prompt with brand context
    const systemPrompt = buildSystemPrompt(agent, brand);

    // Call Claude API with streaming
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "API key not configured" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const claudeMessages = userMessages.map((msg: { role: string; content: string }) => ({
      role: msg.role,
      content: msg.content,
    }));

    const claudeResponse = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 4096,
        system: systemPrompt,
        messages: claudeMessages,
        stream: true,
      }),
    });

    if (!claudeResponse.ok) {
      const errorText = await claudeResponse.text();
      console.error("Claude API error:", errorText);
      return new Response(
        JSON.stringify({ error: "AI service error" }),
        { status: 502, headers: { "Content-Type": "application/json" } }
      );
    }

    // Stream the response
    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        const reader = claudeResponse.body?.getReader();
        if (!reader) {
          controller.close();
          return;
        }

        const decoder = new TextDecoder();
        let buffer = "";
        let fullResponse = "";

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() || "";

            for (const line of lines) {
              if (line.startsWith("data: ")) {
                const data = line.slice(6).trim();
                if (data === "[DONE]") continue;

                try {
                  const parsed = JSON.parse(data);

                  if (
                    parsed.type === "content_block_delta" &&
                    parsed.delta?.type === "text_delta"
                  ) {
                    const text = parsed.delta.text;
                    fullResponse += text;
                    controller.enqueue(
                      encoder.encode(`data: ${JSON.stringify({ text })}\n\n`)
                    );
                  }

                  if (parsed.type === "message_stop") {
                    // Save conversation async (don't block stream)
                    saveConversation(
                      conversationId,
                      brandId,
                      agentId,
                      userMessages,
                      fullResponse
                    ).catch(console.error);
                  }
                } catch {
                  // Skip unparseable lines
                }
              }
            }
          }
        } catch (err) {
          console.error("Stream error:", err);
        } finally {
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
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
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

function buildSystemPrompt(
  agent: { systemPrompt: string; name: string; role: string },
  brand: {
    name: string;
    industry: string | null;
    brandVoice: string | null;
    icp: string | null;
    services: string | null;
    contentPillars: string | null;
    pastHits: string | null;
    brandStory: string | null;
    platforms: unknown;
  }
): string {
  const brandContext = `
## 當前服務品牌：${brand.name}
${brand.industry ? `**產業：** ${brand.industry}` : ""}

${brand.brandVoice ? `### 品牌聲音\n${brand.brandVoice}` : ""}

${brand.icp ? `### 目標受眾\n${brand.icp}` : ""}

${brand.services ? `### 產品服務\n${brand.services}` : ""}

${brand.contentPillars ? `### 內容策略\n${brand.contentPillars}` : ""}

${brand.pastHits ? `### 高成效參考\n${brand.pastHits}` : ""}

${brand.brandStory ? `### 品牌故事\n${brand.brandStory}` : ""}

${brand.platforms ? `**可用平台：** ${JSON.stringify(brand.platforms)}` : ""}
`.trim();

  return `${agent.systemPrompt}

---

# 品牌資料（自動注入）
${brandContext}

---

**今天日期：${new Date().toLocaleDateString("zh-TW", { year: "numeric", month: "long", day: "numeric" })}**

## 重要提醒
- 所有產出內容必須符合上述品牌調性和目標受眾
- 使用繁體中文回覆
- 產出內容時請標明適用平台和格式
- 每次回覆結尾提供「建議下一步」供使用者參考`;
}

async function saveConversation(
  conversationId: string | undefined,
  brandId: string,
  agentId: string,
  userMessages: { role: string; content: string }[],
  assistantResponse: string
) {
  try {
    const allMessages = [
      ...userMessages,
      { role: "assistant", content: assistantResponse },
    ];

    if (conversationId) {
      // Update existing conversation
      await db
        .update(conversations)
        .set({
          messages: allMessages,
          updatedAt: new Date(),
        })
        .where(eq(conversations.id, conversationId));
    } else {
      // Create new conversation
      const title =
        userMessages[0]?.content?.slice(0, 100) || "新對話";
      await db.insert(conversations).values({
        brandId,
        agentId,
        title,
        messages: allMessages,
        status: "active",
      });
    }
  } catch (err) {
    console.error("Error saving conversation:", err);
  }
}
