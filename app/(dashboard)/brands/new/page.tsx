"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const INDUSTRY_OPTIONS = [
  "個人品牌 / 創業教育",
  "電商 / 零售",
  "餐飲 / 食品",
  "美妝 / 保養",
  "健身 / 運動",
  "科技 / SaaS",
  "房地產",
  "教育 / 培訓",
  "醫療 / 健康",
  "旅遊 / 觀光",
  "金融 / 保險",
  "設計 / 創意",
  "其他",
];

const PLATFORMS = [
  { id: "ig", label: "Instagram", icon: "📸" },
  { id: "fb", label: "Facebook", icon: "👤" },
  { id: "threads", label: "Threads", icon: "🧵" },
  { id: "line", label: "LINE", icon: "💬" },
  { id: "reels", label: "Reels", icon: "🎬" },
  { id: "youtube", label: "YouTube", icon: "▶️" },
  { id: "tiktok", label: "TikTok", icon: "🎵" },
  { id: "ads", label: "廣告投放", icon: "📢" },
  { id: "blog", label: "部落格", icon: "📝" },
  { id: "edm", label: "EDM", icon: "✉️" },
];

export default function NewBrandPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    brandCode: "",
    name: "",
    industry: "",
    status: "draft",
    platforms: ["ig", "fb"] as string[],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!form.brandCode || !form.name) {
      setError("品牌代碼和名稱為必填");
      return;
    }
    if (!/^[a-z0-9_]+$/.test(form.brandCode)) {
      setError("品牌代碼只能包含英文小寫、數字和底線");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/brands", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "新增失敗");
        return;
      }
      router.push(`/brands/${data.brand.id}`);
    } catch {
      setError("新增品牌失敗，請重試");
    } finally {
      setSaving(false);
    }
  };

  const togglePlatform = (p: string) => {
    setForm((prev) => ({
      ...prev,
      platforms: prev.platforms.includes(p)
        ? prev.platforms.filter((x) => x !== p)
        : [...prev.platforms, p],
    }));
  };

  return (
    <div className="max-w-2xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link href="/brands" className="hover:text-gray-300 transition-colors">品牌管理</Link>
        <span>›</span>
        <span className="text-gray-300">新增品牌</span>
      </div>

      <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl">
        <div className="px-6 py-5 border-b border-white/[0.06]">
          <h1 className="text-xl font-bold text-white">新增品牌</h1>
          <p className="text-sm text-gray-500 mt-1">建立品牌基本資料後，可再進入編輯詳細內容</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-400">
              {error}
            </div>
          )}

          {/* Brand Code */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              品牌代碼 <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600">@</span>
              <input
                type="text"
                value={form.brandCode}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    brandCode: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""),
                  }))
                }
                placeholder="hopeceo"
                className="w-full pl-8 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-gray-700 focus:outline-none focus:border-blue-500/50 transition-colors font-mono text-sm"
              />
            </div>
            <p className="text-[11px] text-gray-600 mt-1">唯一代碼，只能使用英文小寫、數字和底線</p>
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              品牌名稱 <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="希望執行長 Hope CEO"
              className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-gray-700 focus:outline-none focus:border-blue-500/50 transition-colors text-sm"
            />
          </div>

          {/* Industry */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">產業類別</label>
            <select
              value={form.industry}
              onChange={(e) => setForm((prev) => ({ ...prev, industry: e.target.value }))}
              className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-blue-500/50 transition-colors text-sm appearance-none"
            >
              <option value="" className="bg-gray-900">選擇產業</option>
              {INDUSTRY_OPTIONS.map((opt) => (
                <option key={opt} value={opt} className="bg-gray-900">{opt}</option>
              ))}
            </select>
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">狀態</label>
            <div className="flex gap-2">
              {[
                { value: "active", label: "營運中", desc: "已有完整資料" },
                { value: "draft", label: "待補充", desc: "資料尚在建置中" },
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setForm((prev) => ({ ...prev, status: opt.value }))}
                  className={`flex-1 p-3 rounded-xl border text-left transition-all ${
                    form.status === opt.value
                      ? "bg-blue-600/10 border-blue-500/30 text-white"
                      : "bg-white/[0.02] border-white/10 text-gray-500 hover:bg-white/5"
                  }`}
                >
                  <div className="text-sm font-medium">{opt.label}</div>
                  <div className="text-[11px] opacity-60 mt-0.5">{opt.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Platforms */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">適用平台</label>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
              {PLATFORMS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => togglePlatform(p.id)}
                  className={`flex items-center gap-1.5 px-2.5 py-2 rounded-xl border text-xs transition-all ${
                    form.platforms.includes(p.id)
                      ? "bg-blue-600/10 border-blue-500/30 text-white"
                      : "bg-white/[0.02] border-white/10 text-gray-500 hover:bg-white/5"
                  }`}
                >
                  <span>{p.icon}</span>
                  <span>{p.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-4 border-t border-white/[0.06]">
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {saving ? "建立中..." : "建立品牌"}
            </button>
            <Link href="/brands" className="px-4 py-2.5 text-gray-500 hover:text-gray-300 transition-colors text-sm">
              取消
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
