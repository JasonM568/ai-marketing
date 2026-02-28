"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface Brand {
  id: string;
  name: string;
  brandCode: string;
  industry: string | null;
  platforms: string[];
  status: string;
}

interface Agent {
  id: string;
  name: string;
  role: string;
  category: string;
  icon: string;
  description: string;
  agentCode: string;
  capabilities: string[];
}

interface Message {
  role: "user" | "assistant";
  content: string;
}

type Step = "brand" | "agent" | "chat";

export default function WorkspacePage() {
  const searchParams = useSearchParams();
  const [step, setStep] = useState<Step>("brand");
  const [brands, setBrands] = useState<Brand[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [conversationId, setConversationId] = useState<string | undefined>();
  const [savingDraft, setSavingDraft] = useState<number | null>(null);
  const [copied, setCopied] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    fetch("/api/brands", { credentials: "include" }).then((r) => r.json()).then((d) => setBrands(d.brands || d)).catch(console.error);
    fetch("/api/agents", { credentials: "include" }).then((r) => r.json()).then((d) => setAgents(Array.isArray(d) ? d : [])).catch(console.error);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (brands.length === 0 || agents.length === 0) return;
    const bId = searchParams.get("brandId");
    const aId = searchParams.get("agentId");
    const topic = searchParams.get("topic");
    if (bId) {
      const brand = brands.find((b: any) => b.id === bId);
      if (brand) {
        setSelectedBrand(brand);
        if (aId) {
          const agent = agents.find((a: any) => a.id === aId);
          if (agent) {
            setSelectedAgent(agent);
            setStep("chat");
            if (topic) setInput(topic);
          } else { setStep("agent"); }
        } else { setStep("agent"); }
      }
    }
  }, [brands, agents, searchParams]);

  function selectBrand(brand: Brand) {
    setSelectedBrand(brand);
    setStep("agent");
  }

  function selectAgent(agent: Agent) {
    setSelectedAgent(agent);
    setMessages([]);
    setConversationId(undefined);
    setStep("chat");
  }

  function resetToStep(target: Step) {
    if (target === "brand") {
      setSelectedBrand(null);
      setSelectedAgent(null);
      setMessages([]);
      setConversationId(undefined);
    } else if (target === "agent") {
      setSelectedAgent(null);
      setMessages([]);
      setConversationId(undefined);
    }
    setStep(target);
  }

  const sendMessage = useCallback(async () => {
    if (!input.trim() || isStreaming || !selectedBrand || !selectedAgent) return;

    const userMessage: Message = { role: "user", content: input.trim() };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setIsStreaming(true);

    // Auto-resize textarea back
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brandId: selectedBrand.id,
          agentId: selectedAgent.id,
          conversationId,
          messages: newMessages,
        }),
      });

      if (!response.ok) {
        throw new Error("Chat request failed");
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No reader");

      const decoder = new TextDecoder();
      let assistantContent = "";
      let buffer = "";

      // Add empty assistant message
      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

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
              if (parsed.text) {
                assistantContent += parsed.text;
                setMessages((prev) => {
                  const updated = [...prev];
                  updated[updated.length - 1] = {
                    role: "assistant",
                    content: assistantContent,
                  };
                  return updated;
                });
              }
            } catch {
              // Skip
            }
          }
        }
      }
    } catch (error) {
      console.error("Chat error:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "⚠️ 發生錯誤，請稍後再試。",
        },
      ]);
    } finally {
      setIsStreaming(false);
    }
  }, [input, isStreaming, selectedBrand, selectedAgent, messages, conversationId]);

  async function copyContent(index: number) {
    const msg = messages[index];
    if (!msg) return;
    await navigator.clipboard.writeText(msg.content);
    setCopied(index);
    setTimeout(() => setCopied(null), 2000);
  }

  async function saveToDraft(index: number) {
    const msg = messages[index];
    if (!msg || !selectedBrand || !selectedAgent) return;

    setSavingDraft(index);
    try {
      const res = await fetch("/api/drafts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brandId: selectedBrand.id,
          agentId: selectedAgent.id,
          conversationId,
          topic: messages[0]?.content?.slice(0, 100) || "",
          content: msg.content,
        }),
      });
      if (!res.ok) throw new Error("Failed to save draft");
    } catch (err) {
      console.error("Save draft error:", err);
    } finally {
      setTimeout(() => setSavingDraft(null), 2000);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  function autoResize(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setInput(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 200) + "px";
  }

  const contentAgents = agents.filter((a) => a.category === "content");
  const strategyAgents = agents.filter((a) => a.category === "strategy");

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col">
      {/* Step Breadcrumb */}
      <div className="flex items-center gap-2 px-1 py-3 text-sm flex-shrink-0">
        <button
          onClick={() => resetToStep("brand")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${step === "brand"
            ? "bg-blue-600 text-white"
            : selectedBrand
              ? "bg-gray-800 text-blue-400 hover:bg-gray-700 cursor-pointer"
              : "bg-gray-800/50 text-gray-500"
            }`}
        >
          <span>①</span>
          <span>{selectedBrand ? selectedBrand.name : "選擇品牌"}</span>
        </button>
        <span className="text-gray-600">→</span>
        <button
          onClick={() => selectedBrand && resetToStep("agent")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${step === "agent"
            ? "bg-blue-600 text-white"
            : selectedAgent
              ? "bg-gray-800 text-purple-400 hover:bg-gray-700 cursor-pointer"
              : "bg-gray-800/50 text-gray-500"
            }`}
        >
          <span>②</span>
          <span>
            {selectedAgent
              ? `${selectedAgent.icon} ${selectedAgent.name}`
              : "選擇代理"}
          </span>
        </button>
        <span className="text-gray-600">→</span>
        <div
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg ${step === "chat"
            ? "bg-blue-600 text-white"
            : "bg-gray-800/50 text-gray-500"
            }`}
        >
          <span>③</span>
          <span>對話產出</span>
        </div>
      </div>

      {/* Step Content */}
      <div className="flex-1 overflow-hidden">
        {/* Step 1: Select Brand */}
        {step === "brand" && (
          <div className="h-full overflow-y-auto px-1 pb-4">
            <h2 className="text-xl font-bold text-white mb-1">選擇品牌</h2>
            <p className="text-gray-500 text-sm mb-4">
              選擇要產出內容的品牌，AI 會自動載入品牌資料
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {brands
                .filter((b) => b.status !== "inactive")
                .map((brand) => (
                  <button
                    key={brand.id}
                    onClick={() => selectBrand(brand)}
                    className="bg-gray-900 border border-gray-800 rounded-xl p-5 text-left hover:border-blue-600/50 transition-all group"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-white font-semibold group-hover:text-blue-400 transition-colors">
                        {brand.name}
                      </h3>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-green-900/50 text-green-400">
                        {brand.status === "active" ? "營運中" : brand.status}
                      </span>
                    </div>
                    {brand.industry && (
                      <p className="text-gray-500 text-sm">{brand.industry}</p>
                    )}
                    {brand.platforms && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {(brand.platforms as string[]).slice(0, 5).map((p, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 text-xs rounded-full bg-gray-800 text-gray-400"
                          >
                            {p.toUpperCase()}
                          </span>
                        ))}
                      </div>
                    )}
                  </button>
                ))}
            </div>
            {brands.length === 0 && (
              <div className="text-center py-16 text-gray-500">
                <p className="text-4xl mb-3">📋</p>
                <p>尚未建立品牌，請先到品牌管理新增</p>
              </div>
            )}
          </div>
        )}

        {/* Step 2: Select Agent */}
        {step === "agent" && (
          <div className="h-full overflow-y-auto px-1 pb-4">
            <h2 className="text-xl font-bold text-white mb-1">選擇 AI 代理</h2>
            <p className="text-gray-500 text-sm mb-4">
              為「{selectedBrand?.name}」選擇合適的 AI 代理
            </p>

            {/* Content Agents */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-400 mb-3 flex items-center gap-2">
                <span className="w-6 h-6 bg-blue-600/20 rounded flex items-center justify-center text-xs">
                  ✍️
                </span>
                內容產出組
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {contentAgents.map((agent) => (
                  <AgentSelectCard
                    key={agent.id}
                    agent={agent}
                    onClick={() => selectAgent(agent)}
                  />
                ))}
              </div>
            </div>

            {/* Strategy Agents */}
            <div>
              <h3 className="text-sm font-semibold text-gray-400 mb-3 flex items-center gap-2">
                <span className="w-6 h-6 bg-purple-600/20 rounded flex items-center justify-center text-xs">
                  🧠
                </span>
                策略分析組
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {strategyAgents.map((agent) => (
                  <AgentSelectCard
                    key={agent.id}
                    agent={agent}
                    onClick={() => selectAgent(agent)}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Chat */}
        {step === "chat" && (
          <div className="h-full flex flex-col">
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto px-1 pb-4">
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-gray-500">
                  <span className="text-5xl mb-4">{selectedAgent?.icon}</span>
                  <p className="text-lg text-white font-medium">
                    {selectedAgent?.name}
                  </p>
                  <p className="text-sm mt-1">
                    正在為「{selectedBrand?.name}」服務
                  </p>
                  <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-lg">
                    {getQuickPrompts(selectedAgent).map((prompt, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          setInput(prompt);
                          textareaRef.current?.focus();
                        }}
                        className="text-left px-4 py-3 bg-gray-900 border border-gray-800 rounded-lg text-sm text-gray-400 hover:border-blue-600/50 hover:text-gray-300 transition-all"
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`mb-4 ${msg.role === "user" ? "flex justify-end" : ""
                    }`}
                >
                  {msg.role === "user" ? (
                    <div className="bg-blue-600 text-white rounded-2xl rounded-br-md px-4 py-3 max-w-[80%]">
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    </div>
                  ) : (
                    <div className="max-w-[90%]">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm">{selectedAgent?.icon}</span>
                        <span className="text-xs text-gray-500">
                          {selectedAgent?.name}
                        </span>
                      </div>
                      <div className="bg-gray-900 border border-gray-800 rounded-2xl rounded-tl-md px-5 py-4">
                        <div className="prose prose-invert prose-sm max-w-none">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                        </div>
                        {/* Action buttons */}
                        {msg.content && !isStreaming && (
                          <div className="flex gap-2 mt-3 pt-3 border-t border-gray-800">
                            <button
                              onClick={() => copyContent(i)}
                              className="flex items-center gap-1 px-3 py-1.5 text-xs bg-gray-800 hover:bg-gray-700 text-gray-400 rounded-lg transition-colors"
                            >
                              {copied === i ? "✅ 已複製" : "📋 複製"}
                            </button>
                            <button
                              onClick={() => saveToDraft(i)}
                              className="flex items-center gap-1 px-3 py-1.5 text-xs bg-gray-800 hover:bg-gray-700 text-gray-400 rounded-lg transition-colors"
                            >
                              {savingDraft === i
                                ? "✅ 已儲存"
                                : "💾 存為草稿"}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {isStreaming && (
                <div className="flex items-center gap-2 text-gray-500 text-sm ml-2">
                  <span className="animate-pulse">●</span>
                  <span>{selectedAgent?.name} 正在思考...</span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="flex-shrink-0 px-1 pb-3 pt-2 border-t border-gray-800">
              <div className="flex gap-2 items-end">
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={autoResize}
                  onKeyDown={handleKeyDown}
                  placeholder={`對 ${selectedAgent?.name} 說些什麼...`}
                  disabled={isStreaming}
                  rows={1}
                  className="flex-1 bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 resize-none text-sm disabled:opacity-50"
                  style={{ maxHeight: "200px" }}
                />
                <button
                  onClick={sendMessage}
                  disabled={!input.trim() || isStreaming}
                  className="px-4 py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-xl transition-colors flex-shrink-0"
                >
                  {isStreaming ? (
                    <span className="animate-pulse">⏳</span>
                  ) : (
                    "送出"
                  )}
                </button>
              </div>
              <p className="text-xs text-gray-600 mt-1.5 ml-1">
                Enter 送出，Shift+Enter 換行
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function AgentSelectCard({
  agent,
  onClick,
}: {
  agent: Agent;
  onClick: () => void;
}) {
  const isContent = agent.category === "content";
  return (
    <button
      onClick={onClick}
      className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-left hover:border-blue-600/50 transition-all group"
    >
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xl">{agent.icon}</span>
        <div className="min-w-0">
          <h4 className="text-white font-medium text-sm group-hover:text-blue-400 transition-colors truncate">
            {agent.name}
          </h4>
        </div>
      </div>
      <p className="text-gray-500 text-xs line-clamp-2">{agent.description}</p>
      <div className="flex flex-wrap gap-1 mt-2">
        {(agent.capabilities || []).slice(0, 2).map((c, i) => (
          <span
            key={i}
            className={`px-1.5 py-0.5 text-[10px] rounded-full ${isContent
              ? "bg-blue-900/30 text-blue-400"
              : "bg-purple-900/30 text-purple-400"
              }`}
          >
            {c}
          </span>
        ))}
      </div>
    </button>
  );
}

function getQuickPrompts(agent: Agent | null): string[] {
  if (!agent) return [];

  const prompts: Record<string, string[]> = {
    "social-writer": [
      "幫我寫一則 IG 貼文",
      "寫一則 FB 分享文",
      "Threads 短文創作",
      "LINE 推播訊息",
    ],
    "ad-copywriter": [
      "Meta 廣告文案 3 組",
      "Google 搜尋廣告文案",
      "再行銷廣告文案",
      "A/B 測試文案組合",
    ],
    "sales-copywriter": [
      "銷售頁文案",
      "電商產品描述",
      "Landing Page 架構",
      "促銷活動文案",
    ],
    "edm-writer": [
      "歡迎信撰寫",
      "促銷 EDM 文案",
      "棄購挽回信",
      "每週電子報",
    ],
    "seo-writer": [
      "SEO 文章撰寫",
      "Meta 描述優化",
      "關鍵字內容規劃",
      "FAQ Schema 建議",
    ],
    "content-repurposer": [
      "把文章轉成 IG 輪播",
      "長文拆成多則短文",
      "跨平台內容轉製",
      "內容再利用規劃",
    ],
    "cs-responder": [
      "正面留言回覆",
      "負評回覆建議",
      "客訴處理範本",
      "FAQ 自動回覆",
    ],
    "brand-strategist": [
      "月度內容日曆",
      "品牌策略建議",
      "競品分析",
      "行銷規劃",
    ],
    "trend-researcher": [
      "產業趨勢分析",
      "本月內容靈感",
      "社群熱點追蹤",
      "借勢行銷建議",
    ],
    "crm-manager": [
      "客戶分群策略",
      "會員經營規劃",
      "自動化行銷流程",
      "忠誠度計畫設計",
    ],
    "ads-analyst": [
      "廣告成效分析",
      "預算分配建議",
      "A/B 測試分析",
      "ROAS 優化建議",
    ],
    "ga-analyst": [
      "GA4 流量分析",
      "用戶行為分析",
      "轉換漏斗檢視",
      "SEO 成效報告",
    ],
  };

  return prompts[agent.agentCode] || [
    "開始工作",
    "給我一些建議",
    "分析目前狀況",
    "制定計畫",
  ];
}
