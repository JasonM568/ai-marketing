"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface CopyItem {
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
  reviewed: { label: "已完稿", color: "bg-blue-900/50 text-blue-400" },
  published: { label: "已發布", color: "bg-green-900/50 text-green-400" },
};

export default function CopiesPage() {
  const router = useRouter();
  const [copies, setCopies] = useState<CopyItem[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterBrand, setFilterBrand] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [counts, setCounts] = useState({ reviewed: 0, published: 0 });

  useEffect(() => {
    fetch("/api/brands", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => setBrands(d.brands || d || []))
      .catch(console.error);
  }, []);

  useEffect(() => {
    fetchCopies();
  }, [filterBrand, filterStatus, search]);

  async function fetchCopies() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterBrand !== "all") params.set("brandId", filterBrand);
      if (search) params.set("search", search);

      // Fetch reviewed + published in parallel
      const statusList = filterStatus === "all"
        ? ["reviewed", "published"]
        : [filterStatus];

      const results = await Promise.all(
        statusList.map((s) =>
          fetch(`/api/drafts?${params}&status=${s}`, { credentials: "include" })
            .then((r) => r.json())
            .then((d) => (Array.isArray(d) ? d : []))
        )
      );

      const merged = results.flat().sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );

      setCopies(merged);

      // Update counts (use already-fetched results when possible)
      const allReviewed = await fetch(`/api/drafts?status=reviewed`, { credentials: "include" }).then((r) => r.json()).then((d) => Array.isArray(d) ? d.length : 0);
      const allPublished = await fetch(`/api/drafts?status=published`, { credentials: "include" }).then((r) => r.json()).then((d) => Array.isArray(d) ? d.length : 0);
      setCounts({ reviewed: allReviewed, published: allPublished });
    } catch (err) {
      console.error("Error fetching copies:", err);
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
        if (newStatus === "draft") {
          setCopies((prev) => prev.filter((c) => c.id !== id));
          router.push("/drafts");
        } else {
          setCopies((prev) => prev.map((c) => (c.id === id ? { ...c, status: newStatus } : c)));
        }
      }
    } catch (err) {
      console.error("Error updating status:", err);
    }
  }

  async function deleteCopy(id: string) {
    if (!confirm("確定要刪除這份文案嗎？")) return;
    try {
      const res = await fetch(`/api/drafts/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (res.ok) {
        setCopies((prev) => prev.filter((c) => c.id !== id));
      }
    } catch (err) {
      console.error("Error deleting copy:", err);
    }
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setSearch(searchInput);
  }

  function exportCopy(copy: CopyItem, format: "markdown" | "text") {
    const content =
      format === "markdown"
        ? `# ${copy.topic || "未命名文案"}\n\n${copy.content}`
        : (copy.content || "")
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
    a.download = `${copy.topic || "copy"}.${format === "markdown" ? "md" : "txt"}`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">文案完稿</h1>
          <p className="text-gray-400 mt-1">定稿文案，可直接複製取用</p>
        </div>
        <div className="flex gap-3">
          <div className="bg-gray-900 border border-gray-800 rounded-xl px-5 py-3 text-center">
            <p className="text-2xl font-bold text-blue-400">{counts.reviewed}</p>
            <p className="text-xs text-gray-500 mt-0.5">已完稿</p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl px-5 py-3 text-center">
            <p className="text-2xl font-bold text-green-400">{counts.published}</p>
            <p className="text-xs text-gray-500 mt-0.5">已發布</p>
          </div>
        </div>
      </div>

      {/* Status Tabs */}
      <div className="flex gap-2">
        {[
          { key: "all", label: "全部", count: counts.reviewed + counts.published },
          { key: "reviewed", label: "已完稿", count: counts.reviewed },
          { key: "published", label: "已發布", count: counts.published },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilterStatus(tab.key)}
            className={`px-4 py-2 rounded-lg text-sm transition-colors flex items-center gap-2 ${
              filterStatus === tab.key
                ? "bg-blue-600/20 text-blue-400 border border-blue-600/40"
                : "bg-gray-900 text-gray-400 border border-gray-800 hover:border-gray-700"
            }`}
          >
            {tab.label}
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${filterStatus === tab.key ? "bg-blue-600/30" : "bg-gray-800"}`}>
              {tab.count}
            </span>
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
            <option key={b.id} value={b.id}>{b.name}</option>
          ))}
        </select>

        <form onSubmit={handleSearch} className="flex gap-2 flex-1 max-w-md">
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="搜尋文案..."
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
            onClick={() => { setSearch(""); setSearchInput(""); }}
            className="text-sm text-gray-500 hover:text-gray-300"
          >
            ✕ 清除搜尋
          </button>
        )}
      </div>

      {/* Copy List */}
      {loading ? (
        <div className="flex items-center justify-center h-32">
          <div className="text-gray-400">載入中...</div>
        </div>
      ) : copies.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <p className="text-4xl mb-3">📋</p>
          <p>尚無完稿文案</p>
          <p className="text-sm mt-1">在草稿區完成編輯後，點「完稿輸出 →」即可送到這裡</p>
          <Link
            href="/drafts"
            className="inline-block mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm transition-colors"
          >
            前往草稿區
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {copies.map((copy) => (
            <CopyCard
              key={copy.id}
              copy={copy}
              onUpdateStatus={updateStatus}
              onDelete={deleteCopy}
              onExport={exportCopy}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function CopyCard({
  copy,
  onUpdateStatus,
  onDelete,
  onExport,
}: {
  copy: CopyItem;
  onUpdateStatus: (id: string, status: string) => void;
  onDelete: (id: string) => void;
  onExport: (copy: CopyItem, format: "markdown" | "text") => void;
}) {
  const [copied, setCopied] = useState(false);
  const status = statusConfig[copy.status] || statusConfig.reviewed;

  async function copyContent() {
    await navigator.clipboard.writeText(copy.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className={`bg-gray-900 border rounded-xl overflow-hidden ${copy.status === "reviewed" ? "border-blue-900/50" : "border-green-900/30"}`}>
      {/* Card Header */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              {copy.agentIcon && <span className="text-sm">{copy.agentIcon}</span>}
              <span className="text-sm text-gray-400">{copy.agentName || "未知代理"}</span>
              <span className="text-gray-700">·</span>
              <span className="text-sm text-gray-500">{copy.brandName || "未知品牌"}</span>
              {copy.platform && (
                <>
                  <span className="text-gray-700">·</span>
                  <span className="px-1.5 py-0.5 text-xs rounded bg-gray-800 text-gray-400">
                    {copy.platform.toUpperCase()}
                  </span>
                </>
              )}
            </div>
            <h3 className="text-white font-medium">{copy.topic || "未命名文案"}</h3>
            <p className="text-gray-500 text-sm mt-1 line-clamp-2">{copy.content?.slice(0, 120)}...</p>
          </div>

          {/* Right: Status + Copy Button */}
          <div className="flex flex-col items-end gap-2 flex-shrink-0">
            <span className={`px-2 py-0.5 text-xs rounded-full ${status.color}`}>
              {status.label}
            </span>
            <button
              onClick={copyContent}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                copied
                  ? "bg-green-700 text-white"
                  : "bg-green-600 hover:bg-green-500 text-white"
              }`}
            >
              {copied ? "✅ 已複製" : "📋 複製文案"}
            </button>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-white/5">
          <button
            onClick={() => onExport(copy, "markdown")}
            className="flex items-center gap-1 px-3 py-1.5 text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors"
          >
            📥 匯出 Markdown
          </button>
          <button
            onClick={() => onExport(copy, "text")}
            className="flex items-center gap-1 px-3 py-1.5 text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors"
          >
            📥 匯出純文字
          </button>
          <Link
            href={`/drafts/${copy.id}`}
            className="flex items-center gap-1 px-3 py-1.5 text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors"
          >
            ✏️ 編輯
          </Link>
          {copy.status === "reviewed" && (
            <button
              onClick={() => onUpdateStatus(copy.id, "published")}
              className="flex items-center gap-1 px-3 py-1.5 text-xs bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 rounded-lg transition-colors"
            >
              🚀 標記已發布
            </button>
          )}
          <button
            onClick={() => onUpdateStatus(copy.id, "draft")}
            className="flex items-center gap-1 px-3 py-1.5 text-xs bg-gray-800 hover:bg-gray-700 text-gray-400 rounded-lg transition-colors"
          >
            ↩ 退回草稿
          </button>
          <button
            onClick={() => onDelete(copy.id)}
            className="flex items-center gap-1 px-3 py-1.5 text-xs bg-red-900/20 hover:bg-red-900/30 text-red-400 rounded-lg transition-colors ml-auto"
          >
            🗑 刪除
          </button>
        </div>
      </div>
    </div>
  );
}
