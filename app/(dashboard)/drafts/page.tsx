"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface DraftItem {
  id: string;
  brandId: string | null;
  agentId: string | null;
  platform: string | null;
  topic: string | null;
  content: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  brandName: string | null;
  brandCode: string | null;
  agentName: string | null;
  agentIcon: string | null;
}

interface Brand {
  id: string;
  name: string;
}

const statusConfig: Record<string, { label: string; color: string }> = {
  draft: { label: "草稿", color: "bg-yellow-900/50 text-yellow-400" },
  reviewed: { label: "已審核", color: "bg-blue-900/50 text-blue-400" },
  published: { label: "已發布", color: "bg-green-900/50 text-green-400" },
};

export default function DraftsPage() {
  const [drafts, setDrafts] = useState<DraftItem[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterBrand, setFilterBrand] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [totalCounts, setTotalCounts] = useState({ all: 0, draft: 0, reviewed: 0, published: 0 });

  useEffect(() => {
    fetch("/api/brands", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => setBrands(d.brands || d || []))
      .catch(console.error);
  }, []);

  // Fetch total counts (unaffected by filters)
  useEffect(() => {
    fetch("/api/drafts", { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        const all = Array.isArray(data) ? data : [];
        setTotalCounts({
          all: all.length,
          draft: all.filter((d: any) => d.status === "draft").length,
          reviewed: all.filter((d: any) => d.status === "reviewed").length,
          published: all.filter((d: any) => d.status === "published").length,
        });
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    fetchDrafts();
  }, [filterBrand, filterStatus, search]);

  async function fetchDrafts() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterBrand !== "all") params.set("brandId", filterBrand);
      if (filterStatus !== "all") params.set("status", filterStatus);
      if (search) params.set("search", search);

      const res = await fetch(`/api/drafts?${params}`, { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setDrafts(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error("Error fetching drafts:", err);
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(id: string, newStatus: string) {
    try {
      const res = await fetch(`/api/drafts/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setDrafts((prev) =>
          prev.map((d) => (d.id === id ? { ...d, status: newStatus } : d))
        );
      }
    } catch (err) {
      console.error("Error updating status:", err);
    }
  }

  async function deleteDraft(id: string) {
    if (!confirm("確定要刪除這份草稿嗎？")) return;
    try {
      const res = await fetch(`/api/drafts/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (res.ok) {
        setDrafts((prev) => prev.filter((d) => d.id !== id));
      }
    } catch (err) {
      console.error("Error deleting draft:", err);
    }
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setSearch(searchInput);
  }

  function exportDraft(draft: DraftItem, format: "markdown" | "text") {
    const content =
      format === "markdown"
        ? `# ${draft.topic || "未命名草稿"}\n\n${draft.content}`
        : (draft.content || "")
            .replace(/^#{1,6}\s+/gm, "")
            .replace(/\*\*(.+?)\*\*/g, "$1")
            .replace(/\*(.+?)\*/g, "$1")
            .replace(/~~(.+?)~~/g, "$1")
            .replace(/`(.+?)`/g, "$1")
            .replace(/^\s*[-*+]\s+/gm, "• ")
            .replace(/^\s*\d+\.\s+/gm, "")
            .replace(/\[(.+?)\]\(.+?\)/g, "$1")
            .replace(/^>\s+/gm, "");

    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${draft.topic || "draft"}.${format === "markdown" ? "md" : "txt"}`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const counts = totalCounts;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">草稿庫</h1>
        <p className="text-gray-400 mt-1">管理所有 AI 產出的內容草稿</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { key: "all", label: "全部", count: counts.all, icon: "📄" },
          { key: "draft", label: "草稿", count: counts.draft, icon: "✏️" },
          { key: "reviewed", label: "已審核", count: counts.reviewed, icon: "✅" },
          { key: "published", label: "已發布", count: counts.published, icon: "🚀" },
        ].map((stat) => (
          <button
            key={stat.key}
            onClick={() => setFilterStatus(stat.key)}
            className={`bg-gray-900 border rounded-xl p-4 text-left transition-all ${
              filterStatus === stat.key
                ? "border-blue-600"
                : "border-gray-800 hover:border-gray-700"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-gray-500 text-sm">{stat.icon} {stat.label}</span>
              <span className="text-2xl font-bold text-white">{stat.count}</span>
            </div>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <select
          value={filterBrand}
          onChange={(e) => setFilterBrand(e.target.value)}
          className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-blue-500"
        >
          <option value="all">所有品牌</option>
          {(Array.isArray(brands) ? brands : []).map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>

        <form onSubmit={handleSearch} className="flex gap-2 flex-1 max-w-md">
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="搜尋草稿內容..."
            className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-sm transition-colors"
          >
            🔍
          </button>
        </form>

        {search && (
          <button
            onClick={() => {
              setSearch("");
              setSearchInput("");
            }}
            className="text-sm text-gray-500 hover:text-gray-300"
          >
            ✕ 清除搜尋
          </button>
        )}
      </div>

      {/* Draft List */}
      {loading ? (
        <div className="flex items-center justify-center h-32">
          <div className="text-gray-400">載入中...</div>
        </div>
      ) : drafts.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <p className="text-4xl mb-3">📝</p>
          <p>尚無草稿</p>
          <p className="text-sm mt-1">
            到工作台產出內容後，點「存為草稿」即可儲存
          </p>
          <Link
            href="/workspace"
            className="inline-block mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm transition-colors"
          >
            前往工作台
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {drafts.map((draft) => (
            <DraftCard
              key={draft.id}
              draft={draft}
              onUpdateStatus={updateStatus}
              onDelete={deleteDraft}
              onExport={exportDraft}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function DraftCard({
  draft,
  onUpdateStatus,
  onDelete,
  onExport,
}: {
  draft: DraftItem;
  onUpdateStatus: (id: string, status: string) => void;
  onDelete: (id: string) => void;
  onExport: (draft: DraftItem, format: "markdown" | "text") => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const status = statusConfig[draft.status] || statusConfig.draft;
  const preview = draft.content?.slice(0, 150) || "";

  async function copyContent() {
    await navigator.clipboard.writeText(draft.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const nextStatus =
    draft.status === "draft"
      ? "reviewed"
      : draft.status === "reviewed"
      ? "published"
      : null;

  const nextStatusLabel =
    draft.status === "draft"
      ? "標記已審核"
      : draft.status === "reviewed"
      ? "標記已發布"
      : null;

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
      {/* Header */}
      <div
        className="p-4 cursor-pointer hover:bg-gray-800/50 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              {draft.agentIcon && <span className="text-sm">{draft.agentIcon}</span>}
              <span className="text-sm text-gray-400">{draft.agentName || "未知代理"}</span>
              <span className="text-gray-700">·</span>
              <span className="text-sm text-gray-500">{draft.brandName || "未知品牌"}</span>
              {draft.platform && (
                <>
                  <span className="text-gray-700">·</span>
                  <span className="px-1.5 py-0.5 text-xs rounded bg-gray-800 text-gray-400">
                    {draft.platform.toUpperCase()}
                  </span>
                </>
              )}
            </div>
            <h3 className="text-white font-medium truncate">
              {draft.topic || "未命名草稿"}
            </h3>
            {!expanded && (
              <p className="text-gray-500 text-sm mt-1 line-clamp-2">{preview}...</p>
            )}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className={`px-2 py-0.5 text-xs rounded-full ${status.color}`}>
              {status.label}
            </span>
            <span className="text-xs text-gray-600">
              {new Date(draft.createdAt).toLocaleDateString("zh-TW", {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
            <span className="text-gray-600 text-sm">{expanded ? "▲" : "▼"}</span>
          </div>
        </div>
      </div>

      {/* Expanded Content */}
      {expanded && (
        <div className="border-t border-gray-800">
          <div className="p-4">
            <div className="bg-gray-950 border border-gray-800 rounded-lg p-4 mb-4 max-h-96 overflow-y-auto">
              <pre className="text-gray-300 text-sm whitespace-pre-wrap font-sans">
                {draft.content}
              </pre>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={copyContent}
                className="flex items-center gap-1 px-3 py-1.5 text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors"
              >
                {copied ? "✅ 已複製" : "📋 複製內容"}
              </button>

              <button
                onClick={() => onExport(draft, "markdown")}
                className="flex items-center gap-1 px-3 py-1.5 text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors"
              >
                📥 匯出 Markdown
              </button>

              <button
                onClick={() => onExport(draft, "text")}
                className="flex items-center gap-1 px-3 py-1.5 text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors"
              >
                📥 匯出純文字
              </button>

              <Link
                href={`/drafts/${draft.id}`}
                className="flex items-center gap-1 px-3 py-1.5 text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors"
              >
                ✏️ 編輯
              </Link>

              {nextStatus && (
                <button
                  onClick={() => onUpdateStatus(draft.id, nextStatus)}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 rounded-lg transition-colors"
                >
                  ✓ {nextStatusLabel}
                </button>
              )}

              {draft.status === "published" && (
                <button
                  onClick={() => onUpdateStatus(draft.id, "draft")}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs bg-gray-800 hover:bg-gray-700 text-gray-400 rounded-lg transition-colors"
                >
                  ↩ 退回草稿
                </button>
              )}

              <button
                onClick={() => onDelete(draft.id)}
                className="flex items-center gap-1 px-3 py-1.5 text-xs bg-red-900/20 hover:bg-red-900/30 text-red-400 rounded-lg transition-colors ml-auto"
              >
                🗑 刪除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
