"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface Agent {
  id: string;
  agentCode: string;
  name: string;
  role: string;
  category: string;
  description: string;
  icon: string;
  capabilities: string[];
  isActive: boolean;
  sortOrder: number;
}

const categoryLabels: Record<string, { name: string; icon: string; color: string }> = {
  content: { name: "內容產出組", icon: "✍️", color: "blue" },
  strategy: { name: "策略分析組", icon: "🧠", color: "purple" },
};

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>("all");

  useEffect(() => {
    fetchAgents();
  }, []);

  async function fetchAgents() {
    try {
      const res = await fetch("/api/agents");
      if (res.ok) {
        const data = await res.json();
        setAgents(data);
      }
    } catch (err) {
      console.error("Error fetching agents:", err);
    } finally {
      setLoading(false);
    }
  }

  const filteredAgents =
    activeCategory === "all"
      ? agents
      : agents.filter((a) => a.category === activeCategory);

  const contentAgents = agents.filter((a) => a.category === "content");
  const strategyAgents = agents.filter((a) => a.category === "strategy");

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400">載入中...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">AI 代理團隊</h1>
          <p className="text-gray-400 mt-1">
            {agents.length} 位 AI 代理待命中
          </p>
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveCategory("all")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeCategory === "all"
              ? "bg-blue-600 text-white"
              : "bg-gray-800 text-gray-400 hover:bg-gray-700"
          }`}
        >
          全部 ({agents.length})
        </button>
        <button
          onClick={() => setActiveCategory("content")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeCategory === "content"
              ? "bg-blue-600 text-white"
              : "bg-gray-800 text-gray-400 hover:bg-gray-700"
          }`}
        >
          ✍️ 內容產出組 ({contentAgents.length})
        </button>
        <button
          onClick={() => setActiveCategory("strategy")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeCategory === "strategy"
              ? "bg-purple-600 text-white"
              : "bg-gray-800 text-gray-400 hover:bg-gray-700"
          }`}
        >
          🧠 策略分析組 ({strategyAgents.length})
        </button>
      </div>

      {/* Agents Grid */}
      {activeCategory === "all" ? (
        <>
          {/* Content Group */}
          <section>
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-blue-600/20 rounded-lg flex items-center justify-center text-sm">
                ✍️
              </span>
              內容產出組
              <span className="text-sm font-normal text-gray-500">
                — 負責各類行銷內容的撰寫與產出
              </span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {contentAgents.map((agent) => (
                <AgentCard key={agent.id} agent={agent} />
              ))}
            </div>
          </section>

          {/* Strategy Group */}
          <section>
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-purple-600/20 rounded-lg flex items-center justify-center text-sm">
                🧠
              </span>
              策略分析組
              <span className="text-sm font-normal text-gray-500">
                — 負責策略規劃、數據分析與趨勢研究
              </span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {strategyAgents.map((agent) => (
                <AgentCard key={agent.id} agent={agent} />
              ))}
            </div>
          </section>
        </>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredAgents.map((agent) => (
            <AgentCard key={agent.id} agent={agent} />
          ))}
        </div>
      )}

      {agents.length === 0 && (
        <div className="text-center py-16 text-gray-500">
          <p className="text-4xl mb-4">🤖</p>
          <p>尚未建立任何代理</p>
        </div>
      )}
    </div>
  );
}

function AgentCard({ agent }: { agent: Agent }) {
  const isContent = agent.category === "content";
  const accentColor = isContent ? "blue" : "purple";

  return (
    <Link href={`/agents/${agent.id}`}>
      <div
        className={`bg-gray-900 border border-gray-800 rounded-xl p-5 hover:border-${accentColor}-600/50 transition-all cursor-pointer group`}
      >
        {/* Icon + Name */}
        <div className="flex items-start gap-3 mb-3">
          <span className="text-2xl">{agent.icon}</span>
          <div className="flex-1 min-w-0">
            <h3 className="text-white font-semibold group-hover:text-blue-400 transition-colors">
              {agent.name}
            </h3>
            <p className="text-gray-500 text-sm">{agent.role}</p>
          </div>
          <span
            className={`px-2 py-0.5 text-xs rounded-full ${
              agent.isActive
                ? "bg-green-900/50 text-green-400"
                : "bg-gray-800 text-gray-500"
            }`}
          >
            {agent.isActive ? "運作中" : "停用"}
          </span>
        </div>

        {/* Description */}
        <p className="text-gray-400 text-sm mb-3 line-clamp-2">
          {agent.description}
        </p>

        {/* Capabilities Tags */}
        <div className="flex flex-wrap gap-1.5">
          {(agent.capabilities || []).slice(0, 3).map((cap, i) => (
            <span
              key={i}
              className={`px-2 py-0.5 text-xs rounded-full ${
                isContent
                  ? "bg-blue-900/30 text-blue-400"
                  : "bg-purple-900/30 text-purple-400"
              }`}
            >
              {cap}
            </span>
          ))}
          {(agent.capabilities || []).length > 3 && (
            <span className="px-2 py-0.5 text-xs rounded-full bg-gray-800 text-gray-500">
              +{agent.capabilities.length - 3}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
