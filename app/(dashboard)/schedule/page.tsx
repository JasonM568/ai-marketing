"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

interface ScheduledPost {
  id: string;
  brandId: string;
  platform: string;
  content: string;
  imageUrl: string | null;
  scheduledAt: string;
  status: string;
  publishedPostId: string | null;
  publishError: string | null;
  createdAt: string;
}

interface Brand {
  id: string;
  name: string;
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

export default function SchedulePage() {
  const searchParams = useSearchParams();
  const [posts, setPosts] = useState<ScheduledPost[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterBrand, setFilterBrand] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  const success = searchParams.get("success");

  useEffect(() => {
    fetch("/api/brands", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => setBrands(d.brands || d || []))
      .catch(console.error);
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [filterBrand, filterStatus]);

  async function fetchPosts() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterBrand !== "all") params.set("brandId", filterBrand);
      if (filterStatus !== "all") params.set("status", filterStatus);

      const res = await fetch(`/api/schedule?${params}`, { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setPosts(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error("Error fetching scheduled posts:", err);
    } finally {
      setLoading(false);
    }
  }

  function getPlatformIcon(platform: string) {
    return platformIcons[platform.toLowerCase()] || "📱";
  }

  function truncate(text: string, maxLen: number) {
    if (text.length <= maxLen) return text;
    return text.slice(0, maxLen) + "...";
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">排程發文</h1>
          <p className="text-gray-400 mt-1">管理所有排程貼文</p>
        </div>
        <Link
          href="/schedule/new"
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-xl transition-colors"
        >
          建立排程
        </Link>
      </div>

      {/* Success message */}
      {success === "scheduled" && (
        <div className="px-4 py-3 bg-green-900/30 border border-green-700/50 rounded-xl text-green-300 text-sm">
          ✅ 排程建立成功！系統會在排程時間自動發布貼文。
        </div>
      )}

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

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-blue-500"
        >
          <option value="all">所有狀態</option>
          <option value="pending">待確認</option>
          <option value="queued">排程中</option>
          <option value="posting">發布中</option>
          <option value="published">已發布</option>
          <option value="failed">失敗</option>
          <option value="cancelled">已取消</option>
        </select>
      </div>

      {/* Post List */}
      {loading ? (
        <div className="flex items-center justify-center h-32">
          <div className="text-gray-400">載入中...</div>
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <p className="text-4xl mb-3">📅</p>
          <p>尚無排程貼文</p>
          <p className="text-sm mt-1">建立排程來自動發布內容到社群平台</p>
          <Link
            href="/schedule/new"
            className="inline-block mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm transition-colors"
          >
            建立排程
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map((post) => {
            const status = statusConfig[post.status] || statusConfig.pending;
            return (
              <Link
                key={post.id}
                href={`/schedule/${post.id}`}
                className="block bg-gray-900 border border-gray-800 rounded-xl p-4 hover:bg-gray-800/50 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <span className="text-2xl flex-shrink-0 mt-0.5">
                      {getPlatformIcon(post.platform)}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-1.5 py-0.5 text-xs rounded bg-gray-800 text-gray-400">
                          {post.platform.toUpperCase()}
                        </span>
                        <span className={`px-2 py-0.5 text-xs rounded-full ${status.color}`}>
                          {status.label}
                        </span>
                      </div>
                      <p className="text-gray-300 text-sm">
                        {truncate(post.content, 100)}
                      </p>
                    </div>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <div className="text-xs text-gray-500">排程時間</div>
                    <div className="text-sm text-gray-300">
                      {new Date(post.scheduledAt).toLocaleDateString("zh-TW", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
