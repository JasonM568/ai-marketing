"use client";

import { useState, useEffect } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";

interface SocialAccount {
  id: string;
  platform: string;
  platformUsername: string;
  platformUserId: string;
  tokenExpiresAt: string | null;
  status: string;
  createdAt: string;
}

const PLATFORM_INFO: Record<string, { icon: string; label: string; color: string }> = {
  facebook: { icon: "👤", label: "Facebook 粉專", color: "bg-blue-600" },
  instagram: { icon: "📸", label: "Instagram 商業帳號", color: "bg-pink-600" },
  threads: { icon: "🧵", label: "Threads", color: "bg-gray-600" },
};

export default function BrandSocialPage() {
  const { id: brandId } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [disconnecting, setDisconnecting] = useState<string | null>(null);

  const success = searchParams.get("success");
  const error = searchParams.get("error");

  useEffect(() => {
    fetchAccounts();
  }, [brandId]);

  async function fetchAccounts() {
    try {
      const res = await fetch(`/api/social/accounts?brandId=${brandId}`, { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setAccounts(data.filter((a: SocialAccount) => a.status === "active"));
      }
    } catch (err) {
      console.error("Fetch accounts error:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleDisconnect(accountId: string) {
    if (!confirm("確定要斷開此社群帳號連結嗎？")) return;
    setDisconnecting(accountId);
    try {
      await fetch(`/api/social/accounts/${accountId}`, {
        method: "DELETE",
        credentials: "include",
      });
      setAccounts((prev) => prev.filter((a) => a.id !== accountId));
    } catch (err) {
      console.error("Disconnect error:", err);
    } finally {
      setDisconnecting(null);
    }
  }

  function getTokenStatus(expiresAt: string | null) {
    if (!expiresAt) return { label: "未知", color: "text-gray-400" };
    const days = Math.ceil((new Date(expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (days <= 0) return { label: "已過期", color: "text-red-400" };
    if (days <= 7) return { label: `${days} 天後過期`, color: "text-yellow-400" };
    return { label: `${days} 天後過期`, color: "text-green-400" };
  }

  function handleConnect() {
    window.location.href = `/api/social/meta/auth?brandId=${brandId}`;
  }

  function handleConnectThreads() {
    window.location.href = `/api/social/threads/auth?brandId=${brandId}`;
  }

  const hasThreads = accounts.some((a) => a.platform === "threads");

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link
          href={`/brands/${brandId}`}
          className="text-gray-400 hover:text-white transition-colors"
        >
          ← 返回品牌
        </Link>
      </div>

      <h1 className="text-2xl font-bold text-white mb-2">社群帳號管理</h1>
      <p className="text-gray-400 mb-6">連結 Meta 平台帳號（Facebook、Instagram、Threads），以便使用排程發文功能。</p>

      {/* Status messages */}
      {(success === "connected" || success === "threads_connected") && (
        <div className="mb-4 px-4 py-3 bg-green-900/30 border border-green-700/50 rounded-xl text-green-300 text-sm">
          ✅ {success === "threads_connected" ? "Threads 帳號連結成功！" : "社群帳號連結成功！"}
        </div>
      )}
      {error && (
        <div className="mb-4 px-4 py-3 bg-red-900/30 border border-red-700/50 rounded-xl text-red-300 text-sm">
          ❌ 連結失敗：{error === "oauth_denied" || error === "threads_oauth_denied" ? "您拒絕了授權" : error === "no_pages" ? "找不到管理的粉專" : error === "threads_callback_failed" ? "Threads 連結發生錯誤" : "發生錯誤"}
        </div>
      )}

      {/* Connect buttons */}
      <div className="flex flex-wrap gap-3 mb-8">
        <button
          onClick={handleConnect}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-colors font-medium flex items-center gap-2"
        >
          <span className="text-lg">🔗</span>
          連結 Meta 帳號（FB / IG）
        </button>
        {!hasThreads && (
          <button
            onClick={handleConnectThreads}
            className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl transition-colors font-medium flex items-center gap-2"
          >
            <span className="text-lg">🧵</span>
            連結 Threads 帳號
          </button>
        )}
      </div>

      {/* Connected accounts */}
      <h2 className="text-lg font-semibold text-white mb-4">已連結帳號</h2>

      {loading ? (
        <div className="text-gray-400 text-center py-12">載入中...</div>
      ) : accounts.length === 0 ? (
        <div className="text-center py-12 text-gray-500 bg-gray-900/50 rounded-2xl border border-gray-800">
          <p className="text-4xl mb-3">🔌</p>
          <p>尚未連結任何社群帳號</p>
          <p className="text-sm mt-1">點擊上方按鈕開始連結</p>
        </div>
      ) : (
        <div className="space-y-3">
          {accounts.map((account) => {
            const info = PLATFORM_INFO[account.platform] || { icon: "🌐", label: account.platform, color: "bg-gray-600" };
            const tokenStatus = getTokenStatus(account.tokenExpiresAt);

            return (
              <div
                key={account.id}
                className="flex items-center justify-between bg-gray-900/50 border border-gray-800 rounded-xl px-5 py-4"
              >
                <div className="flex items-center gap-4">
                  <span className={`text-2xl w-10 h-10 ${info.color} rounded-lg flex items-center justify-center`}>
                    {info.icon}
                  </span>
                  <div>
                    <div className="text-white font-medium">{info.label}</div>
                    <div className="text-sm text-gray-400">
                      @{account.platformUsername || account.platformUserId}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`text-xs ${tokenStatus.color}`}>
                    {tokenStatus.label}
                  </span>
                  <button
                    onClick={() => handleDisconnect(account.id)}
                    disabled={disconnecting === account.id}
                    className="px-3 py-1.5 text-sm bg-red-900/30 hover:bg-red-900/50 text-red-400 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {disconnecting === account.id ? "斷開中..." : "斷開連結"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Info */}
      <div className="mt-8 px-4 py-3 bg-gray-900/30 border border-gray-800 rounded-xl text-gray-500 text-xs">
        <p>💡 連結後可在「排程發布」功能中選擇平台進行排程。Meta Token 有效期約 60 天，系統會自動刷新。</p>
      </div>
    </div>
  );
}
