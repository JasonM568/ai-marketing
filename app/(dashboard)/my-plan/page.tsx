"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

interface CreditData {
  credits: {
    balance: number;
    monthlyQuota: number;
    carryOver: number;
    maxBrands: number;
    currentPeriodStart: string | null;
    currentPeriodEnd: string | null;
  };
  plan: {
    id: string;
    name: string;
    icon: string;
    price: number;
    monthlyCredits: number;
    maxBrands: number;
  } | null;
  monthlyUsage: { totalUsed: number; totalCount: number };
  usageByType: { contentType: string; totalUsed: number; count: number }[];
  dailyUsage: { date: string; totalUsed: number; count: number }[];
  recentTransactions: {
    id: string;
    type: string;
    amount: number;
    balanceAfter: number;
    description: string;
    createdAt: string;
  }[];
}

const TYPE_LABELS: Record<string, string> = {
  social_post: "社群貼文",
  reels_script: "短影音腳本",
  ad_copy: "廣告文案",
  edm: "EDM 電子報",
  blog_seo: "部落格/SEO",
  strategy: "策略分析",
  conversation: "追問修改",
  ad_analysis: "廣告分析",
  ga_analysis: "GA 分析",
  trend_analysis: "趨勢分析",
  followup: "對話追問",
};

const TX_TYPE_LABELS: Record<string, { label: string; cls: string }> = {
  usage: { label: "使用", cls: "text-red-400" },
  plan_assign: { label: "方案發放", cls: "text-green-400" },
  grant: { label: "加點", cls: "text-green-400" },
  deduct: { label: "扣除", cls: "text-red-400" },
  monthly_reset: { label: "月初發放", cls: "text-blue-400" },
  expire: { label: "過期", cls: "text-gray-400" },
};

export default function MyPlanPage() {
  const [data, setData] = useState<CreditData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/credits");
      if (res.ok) {
        const d = await res.json();
        setData(d);
      }
    } catch {
      console.error("Failed to fetch credits");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return <div className="text-center py-16 text-gray-500">載入中...</div>;
  }

  if (!data) {
    return (
      <div className="text-center py-16">
        <p className="text-4xl mb-3">📦</p>
        <p className="text-gray-400">尚未指派方案</p>
        <p className="text-gray-500 text-sm mt-1">請聯繫管理員開通訂閱方案，或自行訂閱</p>
        <a
          href="/pricing"
          className="inline-block mt-4 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-medium transition-colors"
        >
          前往訂閱 →
        </a>
      </div>
    );
  }

  const { credits, plan, monthlyUsage, usageByType, dailyUsage, recentTransactions } = data;
  const usagePercent = credits.monthlyQuota > 0
    ? Math.round((monthlyUsage.totalUsed / credits.monthlyQuota) * 100)
    : 0;

  // Bar chart max
  const maxDaily = Math.max(...dailyUsage.map((d) => d.totalUsed), 1);

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">💳 我的方案</h1>
        <p className="text-gray-500 text-sm mt-1">查看點數餘額與使用紀錄</p>
      </div>

      {/* Plan + Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Current Plan */}
        <div className="bg-gradient-to-br from-blue-600/20 to-purple-600/20 border border-blue-500/20 rounded-2xl p-5">
          <p className="text-gray-400 text-xs mb-1">目前方案</p>
          <p className="text-2xl font-bold text-white">
            {plan ? `${plan.icon} ${plan.name}` : "—"}
          </p>
          {plan && (
            <p className="text-gray-400 text-sm mt-1">
              NT${plan.price.toLocaleString()}/月 · {plan.monthlyCredits} 點/月
            </p>
          )}
        </div>

        {/* Balance */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
          <p className="text-gray-400 text-xs mb-1">剩餘點數</p>
          <p className="text-3xl font-bold text-white">{credits.balance}</p>
          <p className="text-gray-500 text-xs mt-1">
            本月配額 {credits.monthlyQuota} · 結轉 {credits.carryOver}
          </p>
        </div>

        {/* Monthly Usage */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
          <p className="text-gray-400 text-xs mb-1">本月已使用</p>
          <p className="text-3xl font-bold text-white">
            {monthlyUsage.totalUsed}
            <span className="text-base text-gray-500 font-normal ml-1">/ {credits.monthlyQuota}</span>
          </p>
          {/* Progress bar */}
          <div className="mt-2 h-2 bg-gray-800 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                usagePercent > 90 ? "bg-red-500" : usagePercent > 70 ? "bg-amber-500" : "bg-blue-500"
              }`}
              style={{ width: `${Math.min(usagePercent, 100)}%` }}
            />
          </div>
          <p className="text-gray-500 text-xs mt-1">{usagePercent}% 已使用 · {monthlyUsage.totalCount} 次產出</p>
        </div>
      </div>

      {/* Usage by Type + Daily Chart */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* By Type */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
          <h3 className="text-white font-medium mb-4">📊 本月用量分佈</h3>
          {usageByType.length === 0 ? (
            <p className="text-gray-500 text-sm">本月尚無使用紀錄</p>
          ) : (
            <div className="space-y-3">
              {usageByType.map((u) => (
                <div key={u.contentType} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-300 text-sm">
                      {TYPE_LABELS[u.contentType] || u.contentType}
                    </span>
                    <span className="text-gray-600 text-xs">({u.count} 次)</span>
                  </div>
                  <span className="text-white font-medium text-sm">{u.totalUsed} 點</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Daily Bar Chart */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
          <h3 className="text-white font-medium mb-4">📈 每日用量（近 30 天）</h3>
          {dailyUsage.length === 0 ? (
            <p className="text-gray-500 text-sm">尚無資料</p>
          ) : (
            <div className="flex items-end gap-1 h-32">
              {dailyUsage.map((d) => (
                <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-[9px] text-gray-500">{d.totalUsed}</span>
                  <div
                    className="w-full bg-blue-500/60 rounded-t min-h-[2px] transition-all"
                    style={{ height: `${(d.totalUsed / maxDaily) * 100}%` }}
                  />
                  <span className="text-[8px] text-gray-600 -rotate-45 origin-top-left whitespace-nowrap">
                    {d.date}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Cost Table */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-5 mb-6">
        <h3 className="text-white font-medium mb-4">💡 扣點標準</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {[
            { label: "社群貼文", cost: 3, desc: "IG/FB/Threads/LINE" },
            { label: "短影音腳本", cost: 6, desc: "Reels/短影音" },
            { label: "廣告文案", cost: 3, desc: "Meta/Google 廣告" },
            { label: "EDM 電子報", cost: 6, desc: "歡迎信/促銷信" },
            { label: "部落格/SEO 文案", cost: 9, desc: "SEO 長文章" },
            { label: "策略分析", cost: 12, desc: "品牌策略分析" },
            { label: "追問修改", cost: 0, desc: "每次對話含 5 次免費" },
            { label: "追問（第 6 次起）", cost: 1, desc: "每次 1 點" },
            { label: "廣告分析", cost: 12, desc: "廣告成效分析" },
            { label: "GA 分析", cost: 12, desc: "Google Analytics" },
            { label: "趨勢分析", cost: 12, desc: "市場趨勢分析" },
          ].map((c) => (
            <div key={c.label} className="bg-white/5 rounded-xl p-3 text-center">
              <p className="text-xl font-bold text-blue-400">{c.cost} 點</p>
              <p className="text-white text-sm mt-1">{c.label}</p>
              <p className="text-gray-500 text-[10px]">{c.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Subscription Management */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-5 mb-6">
        <h3 className="text-white font-medium mb-4">🔧 訂閱管理</h3>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/pricing"
            className="px-4 py-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 rounded-xl text-sm transition-colors"
          >
            變更方案
          </Link>
          <Link
            href="/billing"
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl text-sm transition-colors"
          >
            帳單紀錄
          </Link>
        </div>
      </div>

      {/* Transaction History */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
        <h3 className="text-white font-medium mb-4">🕐 點數異動紀錄</h3>
        {recentTransactions.length === 0 ? (
          <p className="text-gray-500 text-sm">尚無紀錄</p>
        ) : (
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {recentTransactions.map((tx) => {
              const txType = TX_TYPE_LABELS[tx.type] || { label: tx.type, cls: "text-gray-400" };
              return (
                <div
                  key={tx.id}
                  className="flex items-center justify-between py-2 border-b border-white/5 last:border-0"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full bg-white/5 ${txType.cls}`}>
                        {txType.label}
                      </span>
                      <span className="text-gray-300 text-sm">{tx.description}</span>
                    </div>
                    <p className="text-gray-600 text-[10px] mt-0.5">
                      {new Date(tx.createdAt).toLocaleString("zh-TW")}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={`font-medium text-sm ${tx.amount > 0 ? "text-green-400" : "text-red-400"}`}>
                      {tx.amount > 0 ? "+" : ""}{tx.amount}
                    </span>
                    <p className="text-gray-600 text-[10px]">餘 {tx.balanceAfter}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
