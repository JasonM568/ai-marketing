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

const statusConfig: Record<string, { label: string; color: string }> = {
  pending: { label: "待確認", color: "bg-gray-700/50 text-gray-300" },
  queued: { label: "排程中", color: "bg-blue-900/50 text-blue-400" },
  posting: { label: "發布中", color: "bg-yellow-900/50 text-yellow-400" },
  published: { label: "已發布", color: "bg-green-900/50 text-green-400" },
  failed: { label: "失敗", color: "bg-red-900/50 text-red-400" },
  cancelled: { label: "已取消", color: "bg-gray-700/50 text-gray-500 line-through" },
};

export default function ScheduleDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [post, setPost] = useState<ScheduledPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (params.id) fetchPost(params.id as string);
  }, [params.id]);

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

  async function confirmSchedule() {
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
      console.error("Confirm error:", err);
    } finally {
      setActionLoading(false);
    }
  }

  async function cancelSchedule() {
    if (!post || !confirm("確定要取消此排程嗎？")) return;
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
      // Reset status back to queued for retry
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

      {/* Header */}
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
                  {status.label}
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
        <div className="bg-blue-900/20 border border-blue-800/30 rounded-xl px-4 py-3 text-sm text-blue-400">
          等待發布... 系統將在排程時間自動發布此貼文。
        </div>
      )}

      {post.status === "published" && post.publishedPostId && (
        <div className="bg-green-900/20 border border-green-800/30 rounded-xl px-4 py-3 text-sm text-green-400">
          已成功發布！貼文 ID：
          <span className="font-mono text-green-300 ml-1">{post.publishedPostId}</span>
        </div>
      )}

      {post.status === "failed" && (
        <div className="bg-red-900/20 border border-red-800/30 rounded-xl px-4 py-3 text-sm text-red-400">
          <div className="font-medium mb-1">發布失敗</div>
          <div className="text-red-400/80">
            {post.publishError || "未知錯誤"}
          </div>
          <div className="text-red-400/60 text-xs mt-1">
            已重試 {post.retryCount} 次
          </div>
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
        {post.status === "pending" && (
          <>
            <button
              onClick={confirmSchedule}
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

        {post.status === "failed" && (
          <button
            onClick={retrySchedule}
            disabled={actionLoading}
            className="px-5 py-2.5 bg-yellow-600 hover:bg-yellow-500 text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-50"
          >
            {actionLoading ? "處理中..." : "重試"}
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
