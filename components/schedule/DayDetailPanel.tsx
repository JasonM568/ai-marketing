"use client";

import { motion } from "framer-motion";
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

interface DayDetailPanelProps {
  date: Date;
  posts: ScheduledPost[];
  onClose: () => void;
}

const platformIcons: Record<string, string> = {
  facebook: "👤",
  fb: "👤",
  instagram: "📸",
  ig: "📸",
  threads: "🧵",
};

const platformColors: Record<string, string> = {
  facebook: "border-l-blue-500",
  fb: "border-l-blue-500",
  instagram: "border-l-pink-500",
  ig: "border-l-pink-500",
  threads: "border-l-purple-500",
};

const statusConfig: Record<string, { label: string; color: string }> = {
  pending: { label: "待確認", color: "text-gray-400 bg-gray-700/50" },
  queued: { label: "排程中", color: "text-blue-400 bg-blue-500/10" },
  posting: { label: "發布中", color: "text-yellow-400 bg-yellow-500/10" },
  published: { label: "已發布", color: "text-green-400 bg-green-500/10" },
  failed: { label: "失敗", color: "text-red-400 bg-red-500/10" },
  cancelled: { label: "已取消", color: "text-gray-500 bg-gray-700/50" },
};

function formatDate(date: Date): string {
  return date.toLocaleDateString("zh-TW", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
  });
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString("zh-TW", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function toDateString(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export default function DayDetailPanel({ date, posts, onClose }: DayDetailPanelProps) {
  const dateStr = toDateString(date);

  // Sort posts by scheduled time
  const sortedPosts = [...posts].sort(
    (a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()
  );

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 bg-black/40 z-40 md:hidden"
        onClick={onClose}
      />

      {/* Desktop: Side panel */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 20 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="hidden md:block absolute top-0 right-0 w-80 lg:w-96 bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl shadow-black/40 z-30 max-h-[600px] overflow-hidden"
      >
        <PanelContent
          date={date}
          dateStr={dateStr}
          posts={sortedPosts}
          onClose={onClose}
        />
      </motion.div>

      {/* Mobile: Bottom sheet */}
      <motion.div
        initial={{ opacity: 0, y: "100%" }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="md:hidden fixed inset-x-0 bottom-0 bg-gray-900 border-t border-gray-800 rounded-t-2xl shadow-2xl z-50 max-h-[70vh] overflow-hidden"
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-gray-700 rounded-full" />
        </div>
        <PanelContent
          date={date}
          dateStr={dateStr}
          posts={sortedPosts}
          onClose={onClose}
        />
      </motion.div>
    </>
  );
}

function PanelContent({
  date,
  dateStr,
  posts,
  onClose,
}: {
  date: Date;
  dateStr: string;
  posts: ScheduledPost[];
  onClose: () => void;
}) {
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
        <div>
          <h3 className="text-sm font-semibold text-white">{formatDate(date)}</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            {posts.length > 0 ? `${posts.length} 筆排程` : "無排程"}
          </p>
        </div>
        <button
          onClick={onClose}
          className="w-7 h-7 rounded-lg bg-gray-800 hover:bg-gray-700 flex items-center justify-center transition-colors"
        >
          <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Post list */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
        {posts.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-3xl mb-2">📭</p>
            <p className="text-gray-500 text-sm">此日尚無排程</p>
          </div>
        ) : (
          posts.map((post) => {
            const status = statusConfig[post.status] || statusConfig.pending;
            const borderColor = platformColors[post.platform.toLowerCase()] || "border-l-gray-500";
            const icon = platformIcons[post.platform.toLowerCase()] || "📱";

            return (
              <Link
                key={post.id}
                href={`/schedule/${post.id}`}
                className={`block bg-gray-800/50 border border-gray-700/50 border-l-2 ${borderColor} rounded-lg p-3 hover:bg-gray-800 transition-colors`}
              >
                <div className="flex items-start gap-2.5">
                  <span className="text-lg flex-shrink-0">{icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] text-gray-500 uppercase font-medium">
                        {post.platform}
                      </span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${status.color}`}>
                        {status.label}
                      </span>
                      <span className="text-[10px] text-gray-600 ml-auto">
                        {formatTime(post.scheduledAt)}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">
                      {post.content}
                    </p>
                  </div>
                </div>
              </Link>
            );
          })
        )}
      </div>

      {/* Footer: Add schedule button */}
      <div className="px-4 py-3 border-t border-gray-800">
        <Link
          href={`/schedule/new?date=${dateStr}`}
          className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-xl transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          在此日新增排程
        </Link>
      </div>
    </div>
  );
}
