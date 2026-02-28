"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Brand } from "@/lib/db/schema";

const TABS = [
  { id: "brandVoice", label: "品牌聲音", icon: "🎙️", desc: "品牌的語氣、風格和溝通方式" },
  { id: "icp", label: "目標受眾", icon: "🎯", desc: "理想客戶輪廓與受眾分析" },
  { id: "services", label: "產品服務", icon: "📦", desc: "品牌提供的產品與服務" },
  { id: "contentPillars", label: "內容策略", icon: "📐", desc: "內容分類與策略規劃" },
  { id: "pastHits", label: "高成效參考", icon: "🔥", desc: "過去表現良好的內容參考" },
  { id: "brandStory", label: "品牌故事", icon: "📖", desc: "品牌起源與核心理念" },
] as const;

type TabId = (typeof TABS)[number]["id"];

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  active: { label: "營運中", cls: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
  draft: { label: "待補充", cls: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
  inactive: { label: "停用", cls: "bg-gray-500/10 text-gray-400 border-gray-500/20" },
};

const PLATFORM_LABELS: Record<string, string> = {
  ig: "📸 IG", fb: "👤 FB", threads: "🧵 Threads", line: "💬 LINE",
  youtube: "▶️ YT", reels: "🎬 Reels", ads: "📢 Ads", blog: "📝 Blog",
  edm: "✉️ EDM", tiktok: "🎵 TikTok",
};

export default function BrandDetailPage() {
  const params = useParams();
  const router = useRouter();
  const brandId = params.id as string;

  const [brand, setBrand] = useState<Brand | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabId>("brandVoice");
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");

  const fetchBrand = useCallback(async () => {
    try {
      const res = await fetch(`/api/brands/${brandId}`);
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setBrand(data.brand);
    } catch {
      console.error("Failed to fetch brand");
    } finally {
      setLoading(false);
    }
  }, [brandId]);

  useEffect(() => {
    fetchBrand();
  }, [fetchBrand]);

  const currentTab = TABS.find((t) => t.id === activeTab)!;
  const currentContent = brand ? ((brand as any)[activeTab] as string) || "" : "";

  const handleStartEdit = () => {
    setEditContent(currentContent);
    setEditing(true);
  };

  const handleSave = async () => {
    if (!brand) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/brands/${brand.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [activeTab]: editContent }),
      });
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setBrand(data.brand);
      setEditing(false);
    } catch {
      alert("儲存失敗，請重試");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!brand || deleteConfirm !== brand.name) return;
    try {
      const res = await fetch(`/api/brands/${brand.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
      router.push("/brands");
    } catch {
      alert("刪除失敗");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!brand) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500 mb-4">找不到該品牌</p>
        <Link href="/brands" className="text-blue-400 hover:underline text-sm">返回品牌列表</Link>
      </div>
    );
  }

  const st = STATUS_MAP[brand.status] || STATUS_MAP.draft;
  const platforms = (brand.platforms as string[]) || [];

  return (
    <div>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link href="/brands" className="hover:text-gray-300 transition-colors">品牌管理</Link>
        <span>›</span>
        <span className="text-gray-300">{brand.name}</span>
      </div>

      {/* Header Card */}
      <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-5 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-blue-600/15 border border-blue-500/20 flex items-center justify-center text-2xl font-bold text-blue-400 shrink-0">
            {brand.name.charAt(0)}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold text-white">{brand.name}</h1>
              <span className={`px-2 py-0.5 text-[10px] font-medium rounded-full border ${st.cls}`}>
                {st.label}
              </span>
            </div>
            <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
              <span className="font-mono text-xs">@{brand.brandCode}</span>
              {brand.industry && <><span>·</span><span>{brand.industry}</span></>}
            </div>
            {platforms.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {platforms.map((p) => (
                  <span key={p} className="px-2 py-0.5 bg-white/5 rounded text-[11px] text-gray-500">
                    {PLATFORM_LABELS[p] || p}
                  </span>
                ))}
              </div>
            )}
          </div>
          <button
            onClick={() => setShowDelete(true)}
            className="shrink-0 p-2 text-gray-600 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all"
            title="刪除品牌"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 overflow-x-auto pb-1">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              if (editing && !confirm("有未儲存的變更，確定切換嗎？")) return;
              setEditing(false);
              setActiveTab(tab.id);
            }}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${activeTab === tab.id
              ? "bg-blue-600/15 text-blue-400 border border-blue-500/25"
              : "text-gray-500 hover:text-gray-300 hover:bg-white/5 border border-transparent"
              }`}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/[0.06]">
          <div>
            <h2 className="font-semibold text-white text-sm flex items-center gap-2">
              <span>{currentTab.icon}</span> {currentTab.label}
            </h2>
            <p className="text-[11px] text-gray-600 mt-0.5">{currentTab.desc}</p>
          </div>
          {!editing ? (
            <button
              onClick={handleStartEdit}
              className="px-3 py-1.5 bg-blue-600/10 text-blue-400 text-xs font-medium rounded-lg hover:bg-blue-600/20 transition-colors"
            >
              編輯
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button onClick={() => setEditing(false)} className="px-3 py-1.5 text-gray-500 text-xs hover:text-gray-300">
                取消
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? "儲存中..." : "儲存"}
              </button>
            </div>
          )}
        </div>

        <div className="p-5">
          {editing ? (
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              placeholder={`使用 Markdown 格式編輯 ${currentTab.label}...\n\n## 標題\n- 項目一\n- 項目二`}
              className="w-full min-h-[400px] p-4 bg-white/[0.03] border border-white/10 rounded-xl text-white/80 placeholder:text-gray-700 font-mono text-sm leading-relaxed resize-y focus:outline-none focus:border-blue-500/30"
              spellCheck={false}
            />
          ) : currentContent ? (
            <div className="prose prose-invert prose-sm max-w-none prose-headings:text-white prose-p:text-gray-400 prose-li:text-gray-400 prose-strong:text-gray-200 prose-code:text-blue-300">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{currentContent}</ReactMarkdown>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-600 mb-3 text-sm">尚未填寫{currentTab.label}</p>
              <button
                onClick={handleStartEdit}
                className="px-3 py-1.5 bg-white/5 text-gray-400 rounded-lg hover:bg-white/10 text-xs"
              >
                開始編輯
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Delete Modal */}
      {showDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70" onClick={() => setShowDelete(false)} />
          <div className="relative w-full max-w-sm bg-gray-900 border border-white/10 rounded-2xl p-6">
            <div className="text-center mb-4">
              <div className="text-3xl mb-2">⚠️</div>
              <h3 className="text-lg font-semibold text-white">確定要刪除品牌嗎？</h3>
              <p className="text-sm text-gray-500 mt-1">
                請輸入 <strong className="text-white">{brand.name}</strong> 以確認
              </p>
            </div>
            <input
              type="text"
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value)}
              placeholder={brand.name}
              className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-gray-700 focus:outline-none focus:border-red-500/50 mb-4 text-sm"
            />
            <div className="flex gap-2">
              <button
                onClick={() => { setShowDelete(false); setDeleteConfirm(""); }}
                className="flex-1 py-2 bg-white/5 text-gray-400 rounded-xl hover:bg-white/10 text-sm"
              >
                取消
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteConfirm !== brand.name}
                className="flex-1 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 disabled:opacity-30 disabled:cursor-not-allowed text-sm font-medium"
              >
                確認刪除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
