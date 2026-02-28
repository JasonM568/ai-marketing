"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import type { Brand } from "@/lib/db/schema";

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  active: { label: "營運中", cls: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
  draft: { label: "待補充", cls: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
  inactive: { label: "停用", cls: "bg-gray-500/10 text-gray-400 border-gray-500/20" },
};

const PLATFORM_ICONS: Record<string, string> = {
  ig: "📸", fb: "👤", threads: "🧵", line: "💬", youtube: "▶️",
  reels: "🎬", ads: "📢", blog: "📝", edm: "✉️", tiktok: "🎵",
};

export default function BrandsPage() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const fetchBrands = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/brands");
      const data = await res.json();
      setBrands(data.brands || []);
    } catch (err) {
      console.error("Failed to fetch brands:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBrands();
  }, [fetchBrands]);

  // Client-side filter
  const filtered = brands.filter((b) => {
    if (statusFilter !== "all" && b.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        b.name.toLowerCase().includes(q) ||
        b.brandCode.toLowerCase().includes(q) ||
        (b.industry || "").toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">🏷️ 品牌管理</h1>
          <p className="text-gray-500 text-sm mt-1">管理所有品牌客戶的資料</p>
        </div>
        <Link
          href="/brands/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          新增品牌
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="搜尋品牌名稱、代碼或產業..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-gray-600 focus:outline-none focus:border-blue-500/50 transition-colors"
          />
        </div>
        <div className="flex gap-1 bg-white/5 rounded-xl p-1 border border-white/10">
          {[
            { value: "all", label: "全部" },
            { value: "active", label: "營運中" },
            { value: "draft", label: "待補充" },
            { value: "inactive", label: "停用" },
          ].map((opt) => (
            <button
              key={opt.value}
              onClick={() => setStatusFilter(opt.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                statusFilter === opt.value
                  ? "bg-white/10 text-white"
                  : "text-gray-500 hover:text-gray-300"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-6 animate-pulse">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-white/10" />
                <div className="flex-1 space-y-2">
                  <div className="h-5 bg-white/10 rounded w-2/3" />
                  <div className="h-3 bg-white/5 rounded w-1/3" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-5xl mb-4">🏷️</div>
          <h3 className="text-lg font-medium text-gray-300 mb-2">
            {brands.length === 0 ? "尚無品牌" : "沒有符合條件的品牌"}
          </h3>
          <p className="text-gray-500 mb-6 text-sm">
            {brands.length === 0
              ? "新增第一個品牌來開始使用 AI 行銷系統"
              : "試試其他搜尋條件"}
          </p>
          {brands.length === 0 && (
            <Link
              href="/brands/new"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600/20 text-blue-400 text-sm rounded-xl hover:bg-blue-600/30 transition-colors"
            >
              + 新增品牌
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((brand) => (
            <BrandCard key={brand.id} brand={brand} />
          ))}
        </div>
      )}
    </div>
  );
}

function BrandCard({ brand }: { brand: Brand }) {
  const st = STATUS_MAP[brand.status] || STATUS_MAP.draft;
  const platforms = (brand.platforms as string[]) || [];

  return (
    <Link href={`/brands/${brand.id}`} className="group block">
      <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-5 hover:bg-white/[0.06] hover:border-white/[0.15] transition-all">
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-xl bg-blue-600/15 border border-blue-500/20 flex items-center justify-center text-lg font-bold text-blue-400 shrink-0">
            {brand.name.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-white truncate group-hover:text-blue-400 transition-colors text-sm">
                {brand.name}
              </h3>
              <span className={`shrink-0 px-2 py-0.5 text-[10px] font-medium rounded-full border ${st.cls}`}>
                {st.label}
              </span>
            </div>
            <p className="text-xs text-gray-600 mt-0.5 font-mono">@{brand.brandCode}</p>
          </div>
        </div>

        {brand.industry && (
          <div className="mt-3">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-white/5 rounded text-[11px] text-gray-500">
              🏢 {brand.industry}
            </span>
          </div>
        )}

        {platforms.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1">
            {platforms.slice(0, 6).map((p) => (
              <span key={p} className="text-xs" title={p}>
                {PLATFORM_ICONS[p] || p}
              </span>
            ))}
          </div>
        )}

        <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between">
          <span className="text-[10px] text-gray-700">
            更新於 {new Date(brand.updatedAt).toLocaleDateString("zh-TW")}
          </span>
          <svg className="w-4 h-4 text-gray-700 group-hover:text-blue-400 group-hover:translate-x-0.5 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </Link>
  );
}
