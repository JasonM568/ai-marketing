"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface SocialAccount {
  id: string;
  platform: string;
  platformUsername: string;
  status: string;
}

interface Monitor {
  id: string;
  brandId: string;
  socialAccountId: string;
  platform: string;
  monitorMode: string;
  publishedPostId: string | null;
  postContentPreview: string | null;
  status: string;
  createdAt: string;
}

interface Brand {
  id: string;
  name: string;
}

interface ScheduledPost {
  id: string;
  content: string;
  platform: string;
  publishedPostId: string | null;
  status: string;
}

export default function CommentSettingsPage() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [selectedBrand, setSelectedBrand] = useState("");
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [monitors, setMonitors] = useState<Monitor[]>([]);
  const [publishedPosts, setPublishedPosts] = useState<ScheduledPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [userPlan, setUserPlan] = useState("");

  // New monitor form
  const [showForm, setShowForm] = useState(false);
  const [formAccount, setFormAccount] = useState("");
  const [formMode, setFormMode] = useState<"specific" | "all">("specific");
  const [formPostId, setFormPostId] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchBrands();
    fetchUserPlan();
  }, []);

  useEffect(() => {
    if (selectedBrand) {
      fetchMonitors();
      fetchAccounts();
      fetchPublishedPosts();
    }
  }, [selectedBrand]);

  async function fetchBrands() {
    try {
      const res = await fetch("/api/brands");
      const data = await res.json();
      const list = data.brands || [];
      setBrands(list);
      if (list.length > 0) setSelectedBrand(list[0].id);
    } catch {
      console.error("Failed to fetch brands");
    } finally {
      setLoading(false);
    }
  }

  async function fetchUserPlan() {
    try {
      const res = await fetch("/api/auth/me");
      const data = await res.json();
      // admin has full access
      if (data.role === "admin") {
        setUserPlan("business");
      } else {
        // Fetch subscription to get plan
        const subRes = await fetch("/api/subscription/status");
        const subData = await subRes.json();
        setUserPlan(subData.planId || "");
      }
    } catch {
      console.error("Failed to fetch plan");
    }
  }

  async function fetchMonitors() {
    try {
      const res = await fetch(`/api/comments/monitors?brandId=${selectedBrand}`);
      const data = await res.json();
      setMonitors(data.monitors || []);
    } catch {
      console.error("Failed to fetch monitors");
    }
  }

  async function fetchAccounts() {
    try {
      const res = await fetch(`/api/social/accounts?brandId=${selectedBrand}`);
      const data = await res.json();
      setAccounts((data.accounts || []).filter((a: SocialAccount) => a.status === "active"));
    } catch {
      console.error("Failed to fetch accounts");
    }
  }

  async function fetchPublishedPosts() {
    try {
      const res = await fetch(`/api/schedule?brandId=${selectedBrand}&status=published`);
      const data = await res.json();
      setPublishedPosts(
        (data.posts || []).filter((p: ScheduledPost) => p.publishedPostId)
      );
    } catch {
      console.error("Failed to fetch posts");
    }
  }

  async function handleCreateMonitor() {
    if (!formAccount) return alert("請選擇社群帳號");
    if (formMode === "specific" && !formPostId) return alert("請選擇貼文");

    setCreating(true);
    try {
      const selectedAccount = accounts.find((a) => a.id === formAccount);
      const selectedPost = publishedPosts.find((p) => p.publishedPostId === formPostId);

      const res = await fetch("/api/comments/monitors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brandId: selectedBrand,
          socialAccountId: formAccount,
          platform: selectedAccount?.platform || "facebook",
          monitorMode: formMode,
          publishedPostId: formMode === "specific" ? formPostId : null,
          postContentPreview: selectedPost?.content?.slice(0, 100) || null,
        }),
      });

      const data = await res.json();
      if (data.error) {
        alert(data.error);
      } else {
        setShowForm(false);
        setFormAccount("");
        setFormMode("specific");
        setFormPostId("");
        fetchMonitors();
      }
    } catch {
      alert("建立失敗");
    } finally {
      setCreating(false);
    }
  }

  async function handleToggleMonitor(id: string, currentStatus: string) {
    const newStatus = currentStatus === "active" ? "paused" : "active";
    try {
      await fetch(`/api/comments/monitors/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      fetchMonitors();
    } catch {
      alert("更新失敗");
    }
  }

  async function handleDeleteMonitor(id: string) {
    if (!confirm("確定要刪除此監控？")) return;
    try {
      await fetch(`/api/comments/monitors/${id}`, { method: "DELETE" });
      fetchMonitors();
    } catch {
      alert("刪除失敗");
    }
  }

  const canUseAllPosts = userPlan === "business";

  const platformLabel = (p: string) => {
    switch (p) {
      case "facebook": return "FB";
      case "instagram": return "IG";
      case "threads": return "Threads";
      default: return p;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">⚙️ 監控設定</h1>
          <p className="text-gray-400 text-sm mt-1">管理留言監控範圍</p>
        </div>
        <Link
          href="/comments"
          className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm transition-colors"
        >
          ← 返回留言列表
        </Link>
      </div>

      {/* Brand selector */}
      <div className="bg-gray-900 rounded-xl border border-white/10 p-4">
        <label className="text-xs text-gray-500 block mb-2">選擇品牌</label>
        <select
          value={selectedBrand}
          onChange={(e) => setSelectedBrand(e.target.value)}
          className="w-full bg-gray-800 border border-white/10 rounded-lg px-3 py-2 text-sm"
        >
          {brands.map((b) => (
            <option key={b.id} value={b.id}>{b.name}</option>
          ))}
        </select>
      </div>

      {/* Monitor list */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">監控中</h2>
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium transition-colors"
          >
            + 新增監控
          </button>
        </div>

        {monitors.length === 0 ? (
          <div className="text-center py-8 bg-gray-900 rounded-xl border border-white/10">
            <p className="text-gray-500">尚未設定監控</p>
            <p className="text-gray-600 text-xs mt-1">新增監控後，留言會自動接收</p>
          </div>
        ) : (
          monitors.map((m) => (
            <div
              key={m.id}
              className="bg-gray-900 rounded-xl border border-white/10 p-4 flex items-center justify-between"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400">
                    {platformLabel(m.platform)}
                  </span>
                  <span className={`text-xs ${m.status === "active" ? "text-green-400" : "text-gray-500"}`}>
                    {m.status === "active" ? "● 監控中" : "⏸ 已暫停"}
                  </span>
                  <span className="text-xs text-gray-600">
                    {m.monitorMode === "all" ? "📢 所有貼文" : "📌 指定貼文"}
                  </span>
                </div>
                {m.postContentPreview && (
                  <p className="text-xs text-gray-500 truncate max-w-md">
                    {m.postContentPreview}
                  </p>
                )}
                {m.monitorMode === "all" && (
                  <p className="text-xs text-purple-400">監控此帳號的所有新貼文留言</p>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleToggleMonitor(m.id, m.status)}
                  className="px-3 py-1 bg-white/5 hover:bg-white/10 rounded text-xs transition-colors"
                >
                  {m.status === "active" ? "暫停" : "啟用"}
                </button>
                <button
                  onClick={() => handleDeleteMonitor(m.id)}
                  className="px-3 py-1 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded text-xs transition-colors"
                >
                  刪除
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* New monitor form */}
      {showForm && (
        <div className="bg-gray-900 rounded-xl border border-blue-500/30 p-6 space-y-4">
          <h3 className="font-semibold">新增監控</h3>

          {/* Account selector */}
          <div>
            <label className="text-xs text-gray-500 block mb-1">社群帳號</label>
            <select
              value={formAccount}
              onChange={(e) => setFormAccount(e.target.value)}
              className="w-full bg-gray-800 border border-white/10 rounded-lg px-3 py-2 text-sm"
            >
              <option value="">請選擇...</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {platformLabel(a.platform)} - @{a.platformUsername}
                </option>
              ))}
            </select>
          </div>

          {/* Monitor mode */}
          <div>
            <label className="text-xs text-gray-500 block mb-2">監控範圍</label>
            <div className="flex gap-3">
              <button
                onClick={() => setFormMode("specific")}
                className={`flex-1 p-3 rounded-lg border text-left transition-colors ${
                  formMode === "specific"
                    ? "border-blue-500 bg-blue-500/10"
                    : "border-white/10 hover:border-white/20"
                }`}
              >
                <p className="text-sm font-medium">📌 指定貼文</p>
                <p className="text-xs text-gray-500 mt-1">監控特定貼文的留言</p>
              </button>

              <button
                onClick={() => {
                  if (!canUseAllPosts) return;
                  setFormMode("all");
                }}
                className={`flex-1 p-3 rounded-lg border text-left transition-colors ${
                  formMode === "all"
                    ? "border-blue-500 bg-blue-500/10"
                    : canUseAllPosts
                    ? "border-white/10 hover:border-white/20"
                    : "border-white/5 opacity-50 cursor-not-allowed"
                }`}
              >
                <p className="text-sm font-medium">
                  📢 所有貼文
                  {!canUseAllPosts && (
                    <span className="ml-2 text-[10px] px-1.5 py-0.5 bg-purple-500/20 text-purple-400 rounded">
                      專業版
                    </span>
                  )}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {canUseAllPosts
                    ? "自動監控所有新貼文留言"
                    : "需升級至專業版方案"}
                </p>
              </button>
            </div>
          </div>

          {/* Post selector (specific mode) */}
          {formMode === "specific" && (
            <div>
              <label className="text-xs text-gray-500 block mb-1">選擇已發布貼文</label>
              {publishedPosts.length === 0 ? (
                <p className="text-xs text-gray-600">此品牌尚無已發布排程貼文</p>
              ) : (
                <select
                  value={formPostId}
                  onChange={(e) => setFormPostId(e.target.value)}
                  className="w-full bg-gray-800 border border-white/10 rounded-lg px-3 py-2 text-sm"
                >
                  <option value="">請選擇...</option>
                  {publishedPosts.map((p) => (
                    <option key={p.publishedPostId} value={p.publishedPostId || ""}>
                      [{platformLabel(p.platform)}] {p.content.slice(0, 60)}...
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          {/* Submit */}
          <div className="flex gap-2 pt-2">
            <button
              onClick={handleCreateMonitor}
              disabled={creating}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 rounded-lg text-sm font-medium transition-colors"
            >
              {creating ? "建立中..." : "建立監控"}
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm transition-colors"
            >
              取消
            </button>
          </div>
        </div>
      )}

      {/* Info box */}
      <div className="bg-gray-900/50 rounded-xl border border-white/5 p-4">
        <h3 className="text-sm font-medium mb-2">ℹ️ 使用說明</h3>
        <ul className="text-xs text-gray-500 space-y-1">
          <li>• 「指定貼文」模式：選擇特定已發布貼文來監控新留言</li>
          <li>• 「所有貼文」模式：自動監控帳號所有貼文的新留言（限專業版方案）</li>
          <li>• 收到新留言後，可在留言列表中批次生成 AI 回覆或個別生成</li>
          <li>• AI 回覆需經人工審核後才會發送，每次生成消耗 1 點</li>
          <li>• 需先在 Meta Developer Dashboard 設定 Webhook 訂閱</li>
        </ul>
      </div>
    </div>
  );
}
