"use client";

import { useEffect, useState } from "react";

interface UserUsage {
  userId: string;
  email: string;
  name: string | null;
  role: string;
  callCount: number;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  costUsd: number;
  costTwd: number;
}

interface UsageData {
  year: number;
  month: number;
  usdToTwd: number;
  summary: {
    totalCallCount: number;
    totalInputTokens: number;
    totalOutputTokens: number;
    totalCostUsd: number;
    totalCostTwd: number;
  };
  users: UserUsage[];
}

export default function UsagePage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [data, setData] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/usage?year=${year}&month=${month}`)
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [year, month]);

  const prevMonth = () => {
    if (month === 1) { setYear(y => y - 1); setMonth(12); }
    else setMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (month === 12) { setYear(y => y + 1); setMonth(1); }
    else setMonth(m => m + 1);
  };

  const formatTokens = (n: number) =>
    n >= 1_000_000 ? `${(n / 1_000_000).toFixed(2)}M` : n >= 1_000 ? `${(n / 1_000).toFixed(1)}K` : String(n);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">API 用量</h1>
          <p className="text-sm text-gray-400 mt-1">各帳號 Token 花費與台幣換算</p>
        </div>
        {/* Month selector */}
        <div className="flex items-center gap-2">
          <button
            onClick={prevMonth}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
          >
            ‹
          </button>
          <span className="text-white font-medium w-24 text-center">
            {year}/{String(month).padStart(2, "0")}
          </span>
          <button
            onClick={nextMonth}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
          >
            ›
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-blue-400/30 border-t-blue-400 rounded-full animate-spin" />
        </div>
      ) : !data ? (
        <div className="text-center text-gray-500 py-20">載入失敗</div>
      ) : (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gray-900 rounded-2xl p-5 border border-white/5">
              <p className="text-xs text-gray-500 mb-1">本月總花費</p>
              <p className="text-2xl font-bold text-white">NT$ {data.summary.totalCostTwd.toLocaleString()}</p>
              <p className="text-xs text-gray-500 mt-1">≈ ${data.summary.totalCostUsd} USD</p>
            </div>
            <div className="bg-gray-900 rounded-2xl p-5 border border-white/5">
              <p className="text-xs text-gray-500 mb-1">API 呼叫次數</p>
              <p className="text-2xl font-bold text-white">{data.summary.totalCallCount.toLocaleString()}</p>
              <p className="text-xs text-gray-500 mt-1">次對話</p>
            </div>
            <div className="bg-gray-900 rounded-2xl p-5 border border-white/5">
              <p className="text-xs text-gray-500 mb-1">Input Tokens</p>
              <p className="text-2xl font-bold text-blue-400">{formatTokens(data.summary.totalInputTokens)}</p>
              <p className="text-xs text-gray-500 mt-1">$3 / 1M tokens</p>
            </div>
            <div className="bg-gray-900 rounded-2xl p-5 border border-white/5">
              <p className="text-xs text-gray-500 mb-1">Output Tokens</p>
              <p className="text-2xl font-bold text-purple-400">{formatTokens(data.summary.totalOutputTokens)}</p>
              <p className="text-xs text-gray-500 mt-1">$15 / 1M tokens</p>
            </div>
          </div>

          {/* Per-user table */}
          <div className="bg-gray-900 rounded-2xl border border-white/5 overflow-hidden">
            <div className="px-6 py-4 border-b border-white/5">
              <h2 className="text-sm font-medium text-white">各帳號明細</h2>
              <p className="text-xs text-gray-500 mt-0.5">匯率 1 USD = {data.usdToTwd} TWD</p>
            </div>

            {data.users.length === 0 ? (
              <div className="text-center text-gray-500 py-16">本月尚無 API 使用紀錄</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs text-gray-500 border-b border-white/5">
                      <th className="text-left px-6 py-3">帳號</th>
                      <th className="text-right px-4 py-3">呼叫次數</th>
                      <th className="text-right px-4 py-3">Input</th>
                      <th className="text-right px-4 py-3">Output</th>
                      <th className="text-right px-4 py-3">總 Tokens</th>
                      <th className="text-right px-6 py-3">花費（TWD）</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {data.users.map((u) => (
                      <tr key={u.userId} className="hover:bg-white/5 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-blue-600/20 flex items-center justify-center text-blue-400 text-xs font-bold">
                              {u.email[0].toUpperCase()}
                            </div>
                            <div>
                              <p className="text-white font-medium">{u.name || u.email.split("@")[0]}</p>
                              <p className="text-xs text-gray-500">{u.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="text-right px-4 py-4 text-gray-300">{u.callCount.toLocaleString()}</td>
                        <td className="text-right px-4 py-4 text-blue-400">{formatTokens(u.inputTokens)}</td>
                        <td className="text-right px-4 py-4 text-purple-400">{formatTokens(u.outputTokens)}</td>
                        <td className="text-right px-4 py-4 text-gray-300">{formatTokens(u.totalTokens)}</td>
                        <td className="text-right px-6 py-4">
                          <span className="text-white font-semibold">NT$ {u.costTwd.toLocaleString()}</span>
                          <span className="text-xs text-gray-500 ml-1">(${u.costUsd})</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
