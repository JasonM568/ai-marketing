"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface Agent {
  id: string;
  agentCode: string;
  name: string;
  role: string;
  category: string;
  description: string;
  icon: string;
  systemPrompt: string;
  capabilities: string[];
  outputFormats: string[];
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

const tabs = [
  { key: "overview", label: "總覽", icon: "📋" },
  { key: "prompt", label: "System Prompt", icon: "🧠" },
  { key: "capabilities", label: "能力與格式", icon: "⚡" },
];

export default function AgentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [agent, setAgent] = useState<Agent | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [copying, setCopying] = useState(false);
  const [userRole, setUserRole] = useState<string>("editor");

  useEffect(() => {
    fetch("/api/auth/me").then(r => r.json()).then(d => setUserRole(d.role || "editor")).catch(() => {});
  }, []);

  useEffect(() => {
    if (params.id) {
      fetchAgent(params.id as string);
    }
  }, [params.id]);

  async function fetchAgent(id: string) {
    try {
      const res = await fetch(`/api/agents/${id}`);
      if (res.ok) {
        const data = await res.json();
        setAgent(data);
      } else {
        router.push("/agents");
      }
    } catch (err) {
      console.error("Error fetching agent:", err);
    } finally {
      setLoading(false);
    }
  }

  async function copyPrompt() {
    if (!agent) return;
    await navigator.clipboard.writeText(agent.systemPrompt);
    setCopying(true);
    setTimeout(() => setCopying(false), 2000);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400">載入中...</div>
      </div>
    );
  }

  if (!agent) return null;

  const isContent = agent.category === "content";

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="text-sm text-gray-500">
        <button onClick={() => router.push("/agents")} className="hover:text-gray-300">
          AI 代理團隊
        </button>
        <span className="mx-2">›</span>
        <span className="text-gray-300">{agent.name}</span>
      </nav>

      {/* Header Card */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <span className="text-4xl">{agent.icon}</span>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-white">{agent.name}</h1>
                <span
                  className={`px-2.5 py-0.5 text-xs rounded-full ${agent.isActive
                    ? "bg-green-900/50 text-green-400"
                    : "bg-gray-800 text-gray-500"
                    }`}
                >
                  {agent.isActive ? "運作中" : "停用"}
                </span>
                <span
                  className={`px-2.5 py-0.5 text-xs rounded-full ${isContent
                    ? "bg-blue-900/30 text-blue-400"
                    : "bg-purple-900/30 text-purple-400"
                    }`}
                >
                  {isContent ? "內容產出組" : "策略分析組"}
                </span>
              </div>
              <p className="text-gray-400 mt-1">{agent.role}</p>
              <p className="text-gray-500 text-sm mt-2">{agent.description}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-800">
        {tabs.filter(tab => tab.key !== "prompt" || userRole === "admin").map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-3 text-sm font-medium transition-colors flex items-center gap-2 border-b-2 ${activeTab === tab.key
              ? "border-blue-500 text-blue-400"
              : "border-transparent text-gray-500 hover:text-gray-300"
              }`}
          >
            <span>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        {activeTab === "overview" && (
          <div className="space-y-6">
            <div>
              <h3 className="text-white font-semibold mb-3">基本資訊</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-800/50 rounded-lg p-4">
                  <p className="text-gray-500 text-sm">代理代碼</p>
                  <p className="text-white font-mono mt-1">{agent.agentCode}</p>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-4">
                  <p className="text-gray-500 text-sm">分類</p>
                  <p className="text-white mt-1">
                    {isContent ? "✍️ 內容產出組" : "🧠 策略分析組"}
                  </p>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-4">
                  <p className="text-gray-500 text-sm">建立時間</p>
                  <p className="text-white mt-1">
                    {new Date(agent.createdAt).toLocaleDateString("zh-TW")}
                  </p>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-4">
                  <p className="text-gray-500 text-sm">排序</p>
                  <p className="text-white mt-1">#{agent.sortOrder}</p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-white font-semibold mb-3">能力標籤</h3>
              <div className="flex flex-wrap gap-2">
                {(agent.capabilities || []).map((cap, i) => (
                  <span
                    key={i}
                    className={`px-3 py-1.5 text-sm rounded-lg ${isContent
                      ? "bg-blue-900/30 text-blue-400"
                      : "bg-purple-900/30 text-purple-400"
                      }`}
                  >
                    {cap}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-white font-semibold mb-3">支援輸出格式</h3>
              <div className="flex flex-wrap gap-2">
                {(agent.outputFormats || []).map((fmt, i) => (
                  <span
                    key={i}
                    className="px-3 py-1.5 text-sm rounded-lg bg-gray-800 text-gray-300"
                  >
                    {fmt}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === "prompt" && userRole === "admin" && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold">System Prompt</h3>
              <button
                onClick={copyPrompt}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-sm transition-colors"
              >
                {copying ? "✅ 已複製" : "📋 複製 Prompt"}
              </button>
            </div>
            <div className="bg-gray-950 border border-gray-800 rounded-lg p-6 prose prose-invert prose-sm max-w-none">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{agent.systemPrompt}</ReactMarkdown>
            </div>
          </div>
        )}

        {activeTab === "capabilities" && (
          <div className="space-y-6">
            <div>
              <h3 className="text-white font-semibold mb-3">能力清單</h3>
              <div className="space-y-2">
                {(agent.capabilities || []).map((cap, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 bg-gray-800/50 rounded-lg p-3"
                  >
                    <span className="text-green-400">✓</span>
                    <span className="text-gray-300">{cap}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-white font-semibold mb-3">輸出格式</h3>
              <div className="space-y-2">
                {(agent.outputFormats || []).map((fmt, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 bg-gray-800/50 rounded-lg p-3"
                  >
                    <span className="text-blue-400">📄</span>
                    <span className="text-gray-300">{fmt}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
