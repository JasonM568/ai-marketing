"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";

interface ReplySuggestion {
  id: string;
  suggestedText: string;
  editedText: string | null;
  status: string;
  postedAt: string | null;
}

interface Comment {
  id: string;
  platform: string;
  platformPostId: string;
  commenterName: string | null;
  commentText: string;
  commentTimestamp: string | null;
  status: string;
  createdAt: string;
  replySuggestion: ReplySuggestion | null;
}

interface Brand {
  id: string;
  name: string;
}

interface Monitor {
  id: string;
  platform: string;
  monitorMode: string;
  publishedPostId: string | null;
  postContentPreview: string | null;
  status: string;
}

export default function CommentsPage() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [selectedBrand, setSelectedBrand] = useState("");
  const [comments, setComments] = useState<Comment[]>([]);
  const [monitors, setMonitors] = useState<Monitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [filter, setFilter] = useState("all");
  const [editingReplyId, setEditingReplyId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<{
    type: "success" | "error" | "info";
    text: string;
  } | null>(null);
  const [autoSync, setAutoSync] = useState(true);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [countdown, setCountdown] = useState(180); // 3 分鐘 = 180 秒
  const autoSyncRef = useRef(autoSync);
  const syncIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);

  // Stats
  const pendingCount = comments.filter(
    (c) => c.replySuggestion?.status === "pending" || c.replySuggestion?.status === "edited"
  ).length;
  const repliedCount = comments.filter((c) => c.status === "replied").length;
  const newCount = comments.filter((c) => c.status === "new").length;
  const activeMonitors = monitors.filter((m) => m.status === "active").length;

  useEffect(() => {
    fetchBrands();
  }, []);

  useEffect(() => {
    if (selectedBrand) {
      fetchComments();
      fetchMonitors();
      setSyncMessage(null);
    }
  }, [selectedBrand, filter]);

  // Keep ref in sync
  useEffect(() => {
    autoSyncRef.current = autoSync;
  }, [autoSync]);

  // Auto-sync timer: every 3 minutes
  useEffect(() => {
    if (!selectedBrand || activeMonitors === 0) return;

    // Clear existing intervals
    if (syncIntervalRef.current) clearInterval(syncIntervalRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);

    // Countdown ticker
    setCountdown(180);
    countdownRef.current = setInterval(() => {
      setCountdown((prev) => (prev <= 1 ? 180 : prev - 1));
    }, 1000);

    // Auto-sync every 3 minutes
    syncIntervalRef.current = setInterval(() => {
      if (autoSyncRef.current && !syncing) {
        handleAutoSync();
      }
      setCountdown(180);
    }, 180_000);

    return () => {
      if (syncIntervalRef.current) clearInterval(syncIntervalRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [selectedBrand, activeMonitors]);

  async function fetchBrands() {
    try {
      const res = await fetch("/api/brands");
      const data = await res.json();
      const brandList = data.brands || [];
      setBrands(brandList);
      if (brandList.length > 0) {
        setSelectedBrand(brandList[0].id);
      }
    } catch {
      console.error("Failed to fetch brands");
    } finally {
      setLoading(false);
    }
  }

  async function fetchMonitors() {
    if (!selectedBrand) return;
    try {
      const res = await fetch(`/api/comments/monitors?brandId=${selectedBrand}`);
      const data = await res.json();
      setMonitors(data.monitors || []);
    } catch {
      setMonitors([]);
    }
  }

  async function fetchComments() {
    try {
      setLoading(true);
      const params = new URLSearchParams({ brandId: selectedBrand });
      if (filter !== "all") params.set("status", filter);

      const res = await fetch(`/api/comments?${params.toString()}`);
      const data = await res.json();
      setComments(data.comments || []);
    } catch {
      console.error("Failed to fetch comments");
    } finally {
      setLoading(false);
    }
  }

  async function handleBatchProcess() {
    if (!selectedBrand) return;
    setProcessing(true);
    try {
      const res = await fetch("/api/comments/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brandId: selectedBrand }),
      });
      const data = await res.json();
      if (data.error) {
        alert(data.error);
      } else {
        setSyncMessage({ type: "success", text: `已處理 ${data.processed} 則留言` });
        fetchComments();
      }
    } catch {
      alert("批次處理失敗");
    } finally {
      setProcessing(false);
    }
  }

  async function handleGenerateReply(commentId: string) {
    setActionLoading(commentId);
    try {
      const res = await fetch("/api/comments/replies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ commentId }),
      });
      const data = await res.json();
      if (data.error) {
        alert(data.error);
      } else {
        fetchComments();
      }
    } catch {
      alert("生成回覆失敗");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleReplyAction(replyId: string, action: string, editedText?: string) {
    setActionLoading(replyId);
    try {
      const res = await fetch(`/api/comments/replies/${replyId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, editedText }),
      });
      const data = await res.json();
      if (data.error) {
        alert(data.error);
      } else {
        setEditingReplyId(null);
        setEditText("");
        fetchComments();
      }
    } catch {
      alert("操作失敗");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleSyncComments() {
    if (!selectedBrand) return;
    setSyncing(true);
    setSyncMessage(null);
    try {
      const res = await fetch("/api/comments/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brandId: selectedBrand }),
      });
      const data = await res.json();
      if (data.error) {
        setSyncMessage({ type: "error", text: data.error });
      } else if (data.errors?.length) {
        setSyncMessage({
          type: "error",
          text: `${data.message}（${data.errors.length} 個錯誤：${data.errors[0]}）`,
        });
        setLastSyncTime(new Date());
        if (data.synced > 0) fetchComments();
      } else {
        setSyncMessage({
          type: data.synced > 0 ? "success" : "info",
          text: data.message,
        });
        setLastSyncTime(new Date());
        if (data.synced > 0) fetchComments();
      }
    } catch {
      setSyncMessage({ type: "error", text: "同步留言失敗，請重試" });
    } finally {
      setSyncing(false);
    }
  }

  // Auto-sync: background sync that refreshes data
  const handleAutoSync = useCallback(async () => {
    if (!selectedBrand || syncing) return;
    setSyncing(true);
    try {
      const res = await fetch("/api/comments/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brandId: selectedBrand }),
      });
      const data = await res.json();
      if (data.synced > 0) {
        setSyncMessage({
          type: "success",
          text: `🔔 自動同步：發現 ${data.synced} 則新留言`,
        });
        setLastSyncTime(new Date());
        fetchComments();
        // Browser notification
        if (Notification.permission === "granted") {
          new Notification("💬 新留言通知", {
            body: `發現 ${data.synced} 則新留言`,
            icon: "/favicon.ico",
          });
        }
      } else {
        setLastSyncTime(new Date());
      }
    } catch {
      // Silent fail for auto-sync
    } finally {
      setSyncing(false);
    }
  }, [selectedBrand, syncing]);

  // Request notification permission on mount
  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "default") {
        Notification.requestPermission();
      }
    }
  }, []);

  const platformLabel = (p: string) => {
    switch (p) {
      case "facebook": return "FB";
      case "instagram": return "IG";
      case "threads": return "Threads";
      default: return p;
    }
  };

  const platformIcon = (p: string) => {
    switch (p) {
      case "facebook": return "👤";
      case "instagram": return "📸";
      case "threads": return "🧵";
      default: return "📱";
    }
  };

  const platformColor = (p: string) => {
    switch (p) {
      case "facebook": return "bg-blue-500/20 text-blue-400";
      case "instagram": return "bg-pink-500/20 text-pink-400";
      case "threads": return "bg-gray-500/20 text-gray-300";
      default: return "bg-gray-500/20 text-gray-400";
    }
  };

  const statusLabel = (s: string) => {
    switch (s) {
      case "new": return "新留言";
      case "processing": return "待審核";
      case "replied": return "已回覆";
      case "ignored": return "已略過";
      case "error": return "錯誤";
      default: return s;
    }
  };

  const statusColor = (s: string) => {
    switch (s) {
      case "new": return "text-yellow-400";
      case "processing": return "text-blue-400";
      case "replied": return "text-green-400";
      case "ignored": return "text-gray-500";
      case "error": return "text-red-400";
      default: return "text-gray-400";
    }
  };

  const msgBgColor = (type: string) => {
    switch (type) {
      case "success": return "bg-green-900/30 border-green-700/50 text-green-300";
      case "error": return "bg-red-900/30 border-red-700/50 text-red-300";
      default: return "bg-blue-900/30 border-blue-700/50 text-blue-300";
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">💬 留言回覆</h1>
        <p className="text-gray-400 text-sm mt-1">AI 半自動留言管理</p>
      </div>

      {/* Step 1: Brand selector — card-based */}
      {brands.length > 1 && (
        <div>
          <label className="text-xs text-gray-500 block mb-2">選擇品牌</label>
          <div className="flex flex-wrap gap-2">
            {brands.map((b) => (
              <button
                key={b.id}
                onClick={() => setSelectedBrand(b.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  selectedBrand === b.id
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                    : "bg-gray-900 border border-white/10 text-gray-400 hover:bg-gray-800 hover:text-white"
                }`}
              >
                {b.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 2: Monitor setup — prominent when no monitors */}
      {!loading && selectedBrand && activeMonitors === 0 && (
        <div className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 rounded-xl border border-blue-500/30 p-6">
          <div className="flex items-start gap-4">
            <div className="text-4xl">📡</div>
            <div className="flex-1">
              <h2 className="text-lg font-bold mb-1">第一步：設定留言監控</h2>
              <p className="text-gray-400 text-sm mb-4">
                選擇要監控的社群帳號和貼文，系統會從平台抓取留言，再用 AI 自動生成回覆建議。
              </p>
              <Link
                href="/comments/settings"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium transition-colors"
              >
                ⚙️ 前往設定監控
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Main content — only show when monitors exist */}
      {activeMonitors > 0 && (
        <>
          {/* Monitor info bar + Sync */}
          <div className="bg-gray-900 rounded-xl border border-white/10 p-4 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-500">
                  監控中：{activeMonitors} 個
                  {monitors.filter((m) => m.status === "active").map((m) => (
                    <span key={m.id} className={`ml-1.5 px-1.5 py-0.5 rounded text-[10px] ${platformColor(m.platform)}`}>
                      {platformIcon(m.platform)} {platformLabel(m.platform)}
                      {m.monitorMode === "all" ? "（全部貼文）" : ""}
                    </span>
                  ))}
                </span>
                <Link href="/comments/settings" className="text-xs text-blue-400 hover:text-blue-300 transition-colors">
                  管理 →
                </Link>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleSyncComments}
                  disabled={syncing}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-700 disabled:text-gray-500 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5"
                >
                  {syncing ? (
                    <>
                      <span className="animate-spin">⏳</span> 同步中...
                    </>
                  ) : (
                    "🔄 同步留言"
                  )}
                </button>
              </div>
            </div>

            {/* Auto-sync status bar */}
            <div className="flex items-center justify-between text-[11px] text-gray-600 border-t border-white/5 pt-2">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setAutoSync(!autoSync)}
                  className={`flex items-center gap-1.5 px-2 py-1 rounded transition-colors ${
                    autoSync
                      ? "bg-green-900/30 text-green-400 hover:bg-green-900/50"
                      : "bg-gray-800 text-gray-500 hover:bg-gray-700"
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${autoSync ? "bg-green-400 animate-pulse" : "bg-gray-600"}`} />
                  {autoSync ? "自動同步 ON" : "自動同步 OFF"}
                </button>
                {autoSync && (
                  <span>下次同步：{Math.floor(countdown / 60)}:{String(countdown % 60).padStart(2, "0")}</span>
                )}
              </div>
              {lastSyncTime && (
                <span>上次同步：{lastSyncTime.toLocaleTimeString("zh-TW")}</span>
              )}
            </div>
          </div>

          {/* Sync message */}
          {syncMessage && (
            <div className={`px-4 py-3 rounded-xl border text-sm ${msgBgColor(syncMessage.type)}`}>
              {syncMessage.text}
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-gray-900 rounded-xl border border-white/10 p-4 text-center">
              <p className="text-3xl font-bold text-yellow-400">{newCount}</p>
              <p className="text-xs text-gray-500 mt-1">新留言</p>
            </div>
            <div className="bg-gray-900 rounded-xl border border-white/10 p-4 text-center">
              <p className="text-3xl font-bold text-blue-400">{pendingCount}</p>
              <p className="text-xs text-gray-500 mt-1">待審核回覆</p>
            </div>
            <div className="bg-gray-900 rounded-xl border border-white/10 p-4 text-center">
              <p className="text-3xl font-bold text-green-400">{repliedCount}</p>
              <p className="text-xs text-gray-500 mt-1">已回覆</p>
            </div>
          </div>

          {/* Actions bar */}
          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={handleBatchProcess}
              disabled={processing || newCount === 0}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-500 rounded-lg text-sm font-medium transition-colors"
            >
              {processing ? "⏳ AI 生成中..." : `🤖 批次生成回覆 (${newCount})`}
            </button>

            <div className="flex items-center gap-1 bg-gray-900 rounded-lg p-1">
              {["all", "new", "processing", "replied", "ignored"].map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1.5 rounded-md text-xs transition-colors ${
                    filter === f
                      ? "bg-white/10 text-white"
                      : "text-gray-500 hover:text-gray-300"
                  }`}
                >
                  {f === "all" ? "全部" : statusLabel(f)}
                </button>
              ))}
            </div>
          </div>

          {/* Comments list */}
          {loading ? (
            <div className="text-center py-12 text-gray-500">載入中...</div>
          ) : comments.length === 0 ? (
            <div className="text-center py-12 bg-gray-900 rounded-xl border border-white/10">
              <p className="text-4xl mb-3">💬</p>
              <p className="text-gray-400">尚無留言</p>
              <p className="text-gray-600 text-sm mt-1 mb-4">
                點擊上方「🔄 同步留言」從社群平台抓取最新留言
              </p>
              <button
                onClick={handleSyncComments}
                disabled={syncing}
                className="px-5 py-2.5 bg-green-600 hover:bg-green-700 disabled:bg-gray-700 disabled:text-gray-500 rounded-lg text-sm font-medium transition-colors"
              >
                {syncing ? "⏳ 同步中..." : "🔄 立即同步留言"}
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {comments.map((comment) => (
                <div
                  key={comment.id}
                  className="bg-gray-900 rounded-xl border border-white/10 p-4"
                >
                  {/* Comment header */}
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${platformColor(comment.platform)}`}>
                      {platformLabel(comment.platform)}
                    </span>
                    <span className={`text-xs ${statusColor(comment.status)}`}>
                      {statusLabel(comment.status)}
                    </span>
                    <span className="text-xs text-gray-600 ml-auto">
                      {comment.commentTimestamp
                        ? new Date(comment.commentTimestamp).toLocaleString("zh-TW")
                        : new Date(comment.createdAt).toLocaleString("zh-TW")}
                    </span>
                  </div>

                  {/* Comment body */}
                  <div className="mb-3">
                    <p className="text-xs text-gray-500 mb-1">
                      {comment.commenterName || "匿名用戶"}：
                    </p>
                    <p className="text-sm text-gray-200">{comment.commentText}</p>
                  </div>

                  {/* Reply suggestion */}
                  {comment.replySuggestion ? (
                    <div className="bg-gray-800/50 rounded-lg p-3 border border-white/5">
                      <p className="text-xs text-gray-500 mb-1">🤖 AI 建議回覆：</p>

                      {editingReplyId === comment.replySuggestion.id ? (
                        <div className="space-y-2">
                          <textarea
                            value={editText}
                            onChange={(e) => setEditText(e.target.value)}
                            rows={3}
                            className="w-full bg-gray-800 border border-white/10 rounded-lg px-3 py-2 text-sm"
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={() =>
                                handleReplyAction(
                                  comment.replySuggestion!.id,
                                  "edit",
                                  editText
                                )
                              }
                              disabled={actionLoading === comment.replySuggestion.id}
                              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-xs"
                            >
                              儲存
                            </button>
                            <button
                              onClick={() => {
                                setEditingReplyId(null);
                                setEditText("");
                              }}
                              className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-xs"
                            >
                              取消
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <p className="text-sm text-gray-300 mb-2">
                            {comment.replySuggestion.editedText ||
                              comment.replySuggestion.suggestedText}
                          </p>

                          {(comment.replySuggestion.status === "pending" ||
                            comment.replySuggestion.status === "edited") && (
                            <div className="flex gap-2">
                              <button
                                onClick={() =>
                                  handleReplyAction(comment.replySuggestion!.id, "approve")
                                }
                                disabled={actionLoading === comment.replySuggestion.id}
                                className="px-3 py-1 bg-green-600 hover:bg-green-700 rounded text-xs font-medium transition-colors"
                              >
                                ✅ 核准發送
                              </button>
                              <button
                                onClick={() => {
                                  setEditingReplyId(comment.replySuggestion!.id);
                                  setEditText(
                                    comment.replySuggestion!.editedText ||
                                      comment.replySuggestion!.suggestedText
                                  );
                                }}
                                className="px-3 py-1 bg-yellow-600/20 hover:bg-yellow-600/30 text-yellow-400 rounded text-xs transition-colors"
                              >
                                ✏️ 編輯
                              </button>
                              <button
                                onClick={() =>
                                  handleReplyAction(comment.replySuggestion!.id, "reject")
                                }
                                disabled={actionLoading === comment.replySuggestion.id}
                                className="px-3 py-1 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded text-xs transition-colors"
                              >
                                ❌ 略過
                              </button>
                            </div>
                          )}

                          {comment.replySuggestion.status === "posted" && (
                            <p className="text-xs text-green-500">
                              ✅ 已發送 {comment.replySuggestion.postedAt
                                ? new Date(comment.replySuggestion.postedAt).toLocaleString("zh-TW")
                                : ""}
                            </p>
                          )}

                          {comment.replySuggestion.status === "rejected" && (
                            <p className="text-xs text-gray-600">已略過此回覆</p>
                          )}
                        </>
                      )}
                    </div>
                  ) : comment.status === "new" ? (
                    <button
                      onClick={() => handleGenerateReply(comment.id)}
                      disabled={actionLoading === comment.id}
                      className="px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 rounded-lg text-xs transition-colors"
                    >
                      {actionLoading === comment.id ? "生成中..." : "🤖 生成 AI 回覆"}
                    </button>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
