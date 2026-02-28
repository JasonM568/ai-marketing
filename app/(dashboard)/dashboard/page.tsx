"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Stats {
  totals: {
    brands: number;
    agents: number;
    drafts: number;
    conversations: number;
  };
  draftsByStatus: { status: string; count: number }[];
  draftsByBrand: { brandName: string; brandCode: string; count: number }[];
  draftsByAgent: {
    agentName: string;
    agentIcon: string;
    agentCategory: string;
    count: number;
  }[];
  recentDrafts: {
    id: string;
    topic: string;
    status: string;
    createdAt: string;
    brandName: string;
    agentName: string;
    agentIcon: string;
  }[];
  dailyDrafts: { date: string; count: number }[];
}

interface Brand {
  id: string;
  name: string;
  brandCode: string;
}

interface Agent {
  id: string;
  name: string;
  agentCode: string;
  icon: string;
}

const slashCommands = [
  { cmd: "/ig-post", label: "IG 貼文", agent: "social-writer", desc: "快速產出 Instagram 貼文" },
  { cmd: "/fb-post", label: "FB 貼文", agent: "social-writer", desc: "快速產出 Facebook 貼文" },
  { cmd: "/threads", label: "Threads", agent: "social-writer", desc: "快速產出 Threads 短文" },
  { cmd: "/line-msg", label: "LINE 訊息", agent: "social-writer", desc: "快速產出 LINE 推播" },
  { cmd: "/ad-copy", label: "廣告文案", agent: "ad-copywriter", desc: "Meta/Google 廣告文案" },
  { cmd: "/sales", label: "銷售文案", agent: "sales-copywriter", desc: "銷售頁/電商文案" },
  { cmd: "/edm", label: "EDM", agent: "edm-writer", desc: "電子郵件行銷文案" },
  { cmd: "/seo", label: "SEO 文章", agent: "seo-writer", desc: "SEO 優化文章" },
  { cmd: "/repurpose", label: "內容再製", agent: "content-repurposer", desc: "一文多用跨平台" },
  { cmd: "/calendar", label: "內容日曆", agent: "brand-strategist", desc: "月度內容排程" },
];

const statusLabels: Record<string, { label: string; color: string }> = {
  draft: { label: "草稿", color: "text-yellow-400" },
  reviewed: { label: "已審核", color: "text-blue-400" },
  published: { label: "已發布", color: "text-green-400" },
};

export default function DashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [commandInput, setCommandInput] = useState("");
  const [showCommands, setShowCommands] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/stats", { credentials: "include" }).then((r) => r.json()),
      fetch("/api/brands", { credentials: "include" }).then((r) => r.json()),
      fetch("/api/agents", { credentials: "include" }).then((r) => r.json()),
    ])
      .then(([statsData, brandsData, agentsData]) => {
        setStats(statsData);
        setBrands(brandsData.brands || brandsData || []);
        setAgents(Array.isArray(agentsData) ? agentsData : []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  function handleCommand(e: React.FormEvent) {
    e.preventDefault();
    const input = commandInput.trim();
    if (!input) return;

    // Parse: /command brandcode topic
    const parts = input.split(/\s+/);
    const cmd = parts[0]?.toLowerCase();
    const brandCode = parts[1]?.toLowerCase();
    const topic = parts.slice(2).join(" ");

    const matched = slashCommands.find((c) => c.cmd === cmd);
    if (!matched) {
      alert(`未知指令：${cmd}\n\n可用指令：${slashCommands.map((c) => c.cmd).join(", ")}`);
      return;
    }

    const brand = (Array.isArray(brands) ? brands : []).find(
      (b) => b.brandCode?.toLowerCase() === brandCode
    );
    const agent = (Array.isArray(agents) ? agents : []).find(
      (a) => a.agentCode === matched.agent
    );

    if (!brand) {
      const available = (Array.isArray(brands) ? brands : [])
        .map((b) => b.brandCode)
        .join(", ");
      alert(`找不到品牌：${brandCode}\n\n可用品牌代碼：${available}`);
      return;
    }

    // Navigate to workspace with pre-selected params
    const params = new URLSearchParams();
    params.set("brandId", brand.id);
    if (agent) params.set("agentId", agent.id);
    if (topic) params.set("topic", topic);
    router.push(`/workspace?${params}`);
    setCommandInput("");
  }

  function handleInputChange(value: string) {
    setCommandInput(value);
    setShowCommands(value.startsWith("/") && value.length < 15);
  }

  function selectCommand(cmd: string) {
    setCommandInput(cmd + " ");
    setShowCommands(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400">載入中...</div>
      </div>
    );
  }

  const maxDailyCount = Math.max(...(stats?.dailyDrafts?.map((d) => d.count) || [1]), 1);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">工作總覽</h1>
        <p className="text-gray-400 mt-1">
          {new Date().toLocaleDateString("zh-TW", {
            year: "numeric",
            month: "long",
            day: "numeric",
            weekday: "long",
          })}
        </p>
      </div>

      {/* Quick Command Bar */}
      <div className="relative">
        <form onSubmit={handleCommand}>
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <input
                value={commandInput}
                onChange={(e) => handleInputChange(e.target.value)}
                onFocus={() => commandInput.startsWith("/") && setShowCommands(true)}
                onBlur={() => setTimeout(() => setShowCommands(false), 200)}
                placeholder="輸入快速指令，例如：/ig-post hopeceo 本週創業心得"
                className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 text-sm"
              />
              {/* Command Autocomplete */}
              {showCommands && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-gray-900 border border-gray-700 rounded-xl shadow-xl z-50 max-h-64 overflow-y-auto">
                  {slashCommands
                    .filter((c) =>
                      c.cmd.startsWith(commandInput.split(" ")[0] || "/")
                    )
                    .map((cmd) => (
                      <button
                        key={cmd.cmd}
                        type="button"
                        onMouseDown={() => selectCommand(cmd.cmd)}
                        className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-800 transition-colors text-left"
                      >
                        <span className="text-blue-400 font-mono text-sm w-24 flex-shrink-0">
                          {cmd.cmd}
                        </span>
                        <span className="text-gray-300 text-sm">{cmd.label}</span>
                        <span className="text-gray-600 text-xs ml-auto">
                          {cmd.desc}
                        </span>
                      </button>
                    ))}
                </div>
              )}
            </div>
            <button
              type="submit"
              className="px-5 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm transition-colors flex-shrink-0"
            >
              執行
            </button>
          </div>
        </form>
        <p className="text-xs text-gray-600 mt-1.5 ml-1">
          格式：/指令 品牌代碼 主題 → 例如 /ig-post hopeceo 本週創業心得
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "品牌", value: stats?.totals.brands || 0, icon: "🏷️", href: "/brands" },
          { label: "AI 代理", value: stats?.totals.agents || 0, icon: "🤖", href: "/agents" },
          { label: "總草稿", value: stats?.totals.drafts || 0, icon: "📝", href: "/drafts" },
          { label: "總對話", value: stats?.totals.conversations || 0, icon: "💬", href: "/workspace" },
        ].map((card) => (
          <Link
            key={card.label}
            href={card.href}
            className="bg-gray-900 border border-gray-800 rounded-xl p-4 hover:border-gray-700 transition-all"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">{card.icon} {card.label}</p>
                <p className="text-2xl font-bold text-white mt-1">{card.value}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Production Chart */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h3 className="text-white font-semibold mb-4">近 7 日產出</h3>
          {(stats?.dailyDrafts?.length || 0) > 0 ? (
            <div className="flex items-end gap-2 h-32">
              {stats?.dailyDrafts?.map((day, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-xs text-gray-400">{day.count}</span>
                  <div
                    className="w-full bg-blue-600 rounded-t-sm min-h-[4px] transition-all"
                    style={{
                      height: `${(day.count / maxDailyCount) * 100}%`,
                    }}
                  />
                  <span className="text-xs text-gray-600">{day.date}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-32 text-gray-600 text-sm">
              尚無資料
            </div>
          )}
        </div>

        {/* Agent Usage */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h3 className="text-white font-semibold mb-4">代理使用率</h3>
          {(stats?.draftsByAgent?.length || 0) > 0 ? (
            <div className="space-y-2">
              {stats?.draftsByAgent?.map((agent, i) => {
                const maxCount = stats.draftsByAgent[0]?.count || 1;
                return (
                  <div key={i} className="flex items-center gap-2">
                    <span className="text-sm w-6 text-center">{agent.agentIcon}</span>
                    <span className="text-sm text-gray-300 w-24 truncate">
                      {agent.agentName}
                    </span>
                    <div className="flex-1 bg-gray-800 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          agent.agentCategory === "content"
                            ? "bg-blue-600"
                            : "bg-purple-600"
                        }`}
                        style={{
                          width: `${(agent.count / maxCount) * 100}%`,
                        }}
                      />
                    </div>
                    <span className="text-xs text-gray-500 w-6 text-right">
                      {agent.count}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex items-center justify-center h-32 text-gray-600 text-sm">
              尚無資料
            </div>
          )}
        </div>

        {/* Brand Output */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h3 className="text-white font-semibold mb-4">各品牌產出數量</h3>
          {(stats?.draftsByBrand?.length || 0) > 0 ? (
            <div className="space-y-3">
              {stats?.draftsByBrand?.map((brand, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between bg-gray-800/50 rounded-lg px-4 py-2.5"
                >
                  <div>
                    <span className="text-white text-sm">{brand.brandName}</span>
                    <span className="text-gray-600 text-xs ml-2">
                      {brand.brandCode}
                    </span>
                  </div>
                  <span className="text-blue-400 font-semibold">{brand.count}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-32 text-gray-600 text-sm">
              尚無資料
            </div>
          )}
        </div>

        {/* Recent Drafts */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-semibold">最近產出</h3>
            <Link
              href="/drafts"
              className="text-xs text-blue-400 hover:text-blue-300"
            >
              查看全部 →
            </Link>
          </div>
          {(stats?.recentDrafts?.length || 0) > 0 ? (
            <div className="space-y-2">
              {stats?.recentDrafts?.map((draft) => {
                const st = statusLabels[draft.status] || statusLabels.draft;
                return (
                  <Link
                    key={draft.id}
                    href={`/drafts/${draft.id}`}
                    className="flex items-center gap-3 bg-gray-800/50 rounded-lg px-3 py-2.5 hover:bg-gray-800 transition-colors"
                  >
                    <span className="text-sm">{draft.agentIcon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white truncate">
                        {draft.topic || "未命名"}
                      </p>
                      <p className="text-xs text-gray-500">
                        {draft.brandName} · {draft.agentName}
                      </p>
                    </div>
                    <span className={`text-xs ${st.color}`}>{st.label}</span>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="flex items-center justify-center h-32 text-gray-600 text-sm">
              尚無資料
            </div>
          )}
        </div>
      </div>

      {/* Quick Commands Reference */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <h3 className="text-white font-semibold mb-4">⚡ 快速指令一覽</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
          {slashCommands.map((cmd) => (
            <button
              key={cmd.cmd}
              onClick={() => {
                setCommandInput(cmd.cmd + " ");
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className="flex flex-col items-start bg-gray-800/50 rounded-lg px-3 py-2.5 hover:bg-gray-800 transition-colors text-left"
            >
              <span className="text-blue-400 font-mono text-xs">{cmd.cmd}</span>
              <span className="text-gray-400 text-xs mt-0.5">{cmd.label}</span>
            </button>
          ))}
        </div>
        <p className="text-xs text-gray-600 mt-3">
          使用方式：在上方輸入框輸入指令，格式為 /指令 品牌代碼 主題
        </p>
      </div>
    </div>
  );
}
