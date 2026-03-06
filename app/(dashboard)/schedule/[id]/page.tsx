"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

interface ScheduledPost {
  id: string;
  draftId: string | null;
  brandId: string;
  socialAccountId: string;
  platform: string;
  content: string;
  imageUrl: string | null;
  scheduledAt: string;
  status: string;
  publishedPostId: string | null;
  publishError: string | null;
  retryCount: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

const platformIcons: Record<string, string> = {
  facebook: "👤",
  fb: "👤",
  instagram: "📸",
  ig: "📸",
  threads: "🧵",
};

const statusConfig: Record<string, { label: string; color: string; icon: string }> = {
  pending: { label: "待確認", color: "bg-gray-700/50 text-gray-300", icon: "⏸" },
  queued: { label: "排程中", color: "bg-blue-900/50 text-blue-400", icon: "📅" },
  posting: { label: "發布中", color: "bg-yellow-900/50 text-yellow-400", icon: "⏳" },
  published: { label: "已發布", color: "bg-green-900/50 text-green-400", icon: "✅" },
  failed: { label: "失敗", color: "bg-red-900/50 text-red-400", icon: "❌" },
  cancelled: { label: "已取消", color: "bg-gray-700/50 text-gray-500", icon: "🚫" },
};

function getCountdown(scheduledAt: string): string {
  const diff = new Date(scheduledAt).getTime() - Date.now();
  if (diff <= 0) return "即將發布";
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  if (days > 0) return `${days} 天 ${hours} 小時後發布`;
  if (hours > 0) return `${hours} 小時 ${minutes} 分鐘後發布`;
  return `${minutes} 分鐘後發布`;
}

export default function ScheduleDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [post, setPost] = useState<ScheduledPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [countdown, setCountdown] = useState("");

  useEffect(() => {
    if (params.id) fetchPost(params.id as string);
  }, [params.id]);

  // Live countdown timer
  useEffect(() => {
    if (!post || post.status !== "queued") return;
    setCountdown(getCountdown(post.scheduledAt));
    const interval = setInterval(() => {
      setCountdown(getCountdown(post.scheduledAt));
    }, 30000); // update every 30s
    return () => clearInterval(interval);
  }, [post]);

  async function fetchPost(id: string) {
    try {
      const res = await fetch(`/api/schedule/${id}`, { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setPost(data);
      } else {
        router.push("/schedule");
      }
    } catch (err) {
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  }

  async function cancelSchedule() {
    if (!post || !confirm("確定要取消此排程嗎？取消後貼文不會被發布。")) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/schedule/${post.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (res.ok) {
        setPost({ ...post, status: "cancelled" });
      }
    } catch (err) {
      console.error("Cancel error:", err);
    } finally {
      setActionLoading(false);
    }
  }

  async function retrySchedule() {
    if (!post) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/schedule/${post.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status: "queued" }),
      });
      if (res.ok) {
        const updated = await res.json();
        setPost(updated);
      }
    } catch (err) {
      console.error("Retry error:", err);
    } finally {
      setActionLoading(false);
    }
  }

  async function publishNow() {
    if (!post || !confirm("確定要立即發布此貼文嗎？")) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/schedule/${post.id}/publish`, {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json();
      if (res.ok && data.post) {
        setPost(data.post);
      } else if (data.post) {
        // Failed but got updated post with error info
        setPost(data.post);
      } else {
        alert(data.error || "發布失敗");
        // Refresh to get latest status
        fetchPost(post.id);
      }
    } catch (err) {
      console.error("Publish error:", err);
      alert("發布失敗，請稍後再試");
      fetchPost(post.id);
    } finally {
      setActionLoading(false);
    }
  }

  function getPlatformIcon(platform: string) {
    return platformIcons[platform.toLowerCase()] || "📱";
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400">載入中...</div>
      </div>
    );
  }

  if (!post) return null;

  const status = statusConfig[post.status] || statusConfig.pending;

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Breadcrumb */}
      <nav className="text-sm text-gray-500">
        <Link href="/schedule" className="hover:text-gray-300">
          排程發文
        </Link>
        <span className="mx-2">›</span>
        <span className="text-gray-300">排程詳情</span>
      </nav>

      {/* Header card */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{getPlatformIcon(post.platform)}</span>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 text-xs rounded bg-gray-800 text-gray-400">
                  {post.platform.toUpperCase()}
                </span>
                <span className={`px-2 py-0.5 text-xs rounded-full ${status.color}`}>
                  {status.icon} {status.label}
                </span>
              </div>
              <div className="text-sm text-gray-500 mt-1">
                排程時間：
                {new Date(post.scheduledAt).toLocaleString("zh-TW", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Status-specific messages */}
      {post.status === "queued" && (
        <div className="bg-blue-900/20 border border-blue-800/30 rounded-xl px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">⏰</span>
            <div>
              <div className="text-blue-300 font-medium">{countdown}</div>
              <div className="text-sm text-blue-400/70 mt-0.5">
                系統會在排程時間自動發布到 {post.platform.toUpperCase()}
              </div>
            </div>
          </div>
        </div>
      )}

      {post.status === "posting" && (
        <div className="bg-yellow-900/20 border border-yellow-800/30 rounded-xl px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 border-2 border-yellow-400/30 border-t-yellow-400 rounded-full animate-spin" />
            <div className="text-yellow-300 font-medium">正在發布到 {post.platform.toUpperCase()}...</div>
          </div>
        </div>
      )}

      {post.status === "pending" && (
        <div className="bg-yellow-900/20 border border-yellow-800/30 rounded-xl px-5 py-4 text-sm text-yellow-400">
          此排程尚未確認。請點擊下方「確認排程」按鈕啟動排程。
        </div>
      )}

      {post.status === "published" && post.publishedPostId && (
        <div className="bg-green-900/20 border border-green-800/30 rounded-xl px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🎉</span>
            <div>
              <div className="text-green-300 font-medium">已成功發布！</div>
              <div className="text-sm text-green-400/70 mt-0.5">
                貼文 ID：<span className="font-mono">{post.publishedPostId}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {post.status === "failed" && (
        <div className="bg-red-900/20 border border-red-800/30 rounded-xl px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">⚠️</span>
            <div>
              <div className="text-red-300 font-medium">發布失敗</div>
              <div className="text-sm text-red-400/80 mt-1">
                {post.publishError || "未知錯誤"}
              </div>
              <div className="text-xs text-red-400/50 mt-1">
                已重試 {post.retryCount} 次（上限 3 次）
              </div>
            </div>
          </div>
        </div>
      )}

      {post.status === "cancelled" && (
        <div className="bg-gray-800/50 border border-gray-700/30 rounded-xl px-5 py-4 text-sm text-gray-500">
          此排程已取消，貼文不會被發布。
        </div>
      )}

      {/* Content */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h3 className="text-sm font-medium text-gray-400 mb-3">貼文內容</h3>
        <div className="bg-gray-950 border border-gray-800 rounded-lg p-4">
          <pre className="text-gray-300 text-sm whitespace-pre-wrap font-sans">
            {post.content}
          </pre>
        </div>
        {post.imageUrl && (
          <div className="mt-3">
            <span className="text-sm text-gray-500">附圖：</span>
            <span className="text-sm text-blue-400 break-all">{post.imageUrl}</span>
          </div>
        )}
      </div>

      {/* Details */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h3 className="text-sm font-medium text-gray-400 mb-3">詳細資訊</h3>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">排程 ID</span>
            <span className="text-gray-300 font-mono text-xs">{post.id}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">建立時間</span>
            <span className="text-gray-300">
              {new Date(post.createdAt).toLocaleString("zh-TW")}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">最後更新</span>
            <span className="text-gray-300">
              {new Date(post.updatedAt).toLocaleString("zh-TW")}
            </span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        {/* Queued: publish now + cancel */}
        {post.status === "queued" && (
          <>
            <button
              onClick={publishNow}
              disabled={actionLoading}
              className="px-5 py-2.5 bg-green-600 hover:bg-green-500 text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-50"
            >
              {actionLoading ? "發布中..." : "🚀 立即發布"}
            </button>
            <button
              onClick={cancelSchedule}
              disabled={actionLoading}
              className="px-5 py-2.5 bg-red-900/20 hover:bg-red-900/30 text-red-400 text-sm rounded-xl transition-colors disabled:opacity-50"
            >
              取消排程
            </button>
          </>
        )}

        {/* Pending (legacy): publish now + confirm + cancel */}
        {post.status === "pending" && (
          <>
            <button
              onClick={async () => {
                setActionLoading(true);
                try {
                  const res = await fetch(`/api/schedule/${post.id}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                    body: JSON.stringify({ status: "queued" }),
                  });
                  if (res.ok) {
                    const updated = await res.json();
                    setPost(updated);
                  }
                } finally {
                  setActionLoading(false);
                }
              }}
              disabled={actionLoading}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-50"
            >
              {actionLoading ? "處理中..." : "確認排程"}
            </button>
            <button
              onClick={cancelSchedule}
              disabled={actionLoading}
              className="px-5 py-2.5 bg-red-900/20 hover:bg-red-900/30 text-red-400 text-sm rounded-xl transition-colors disabled:opacity-50"
            >
              取消
            </button>
          </>
        )}

        {/* Failed: publish now (retry) */}
        {post.status === "failed" && (
          <button
            onClick={publishNow}
            disabled={actionLoading}
            className="px-5 py-2.5 bg-green-600 hover:bg-green-500 text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-50"
          >
            {actionLoading ? "發布中..." : "🚀 重新發布"}
          </button>
        )}

        <Link
          href="/schedule"
          className="px-4 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm rounded-xl transition-colors ml-auto"
        >
          返回列表
        </Link>
      </div>
    </div>
  );
}
