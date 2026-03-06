"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { PLANS } from "@/lib/plans";

interface PaymentRecord {
  id: string;
  ecpayMerchantTradeNo: string;
  ecpayTradeNo: string | null;
  planId: string;
  amount: number;
  status: string;
  paymentType: string;
  createdAt: string;
}

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  pending: { label: "處理中", color: "text-yellow-400" },
  paid: { label: "已付款", color: "text-green-400" },
  failed: { label: "失敗", color: "text-red-400" },
  refunded: { label: "已退款", color: "text-gray-400" },
};

const TYPE_MAP: Record<string, string> = {
  initial: "首次訂閱",
  recurring: "月度續費",
  upgrade: "升級方案",
  downgrade: "降級方案",
};

export default function BillingPage() {
  const [records, setRecords] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBilling();
  }, []);

  async function fetchBilling() {
    try {
      const res = await fetch("/api/subscription/billing", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setRecords(data);
      }
    } catch (err) {
      console.error("Fetch billing error:", err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/my-plan" className="text-gray-400 hover:text-white transition-colors">
          ← 返回方案
        </Link>
      </div>

      <h1 className="text-2xl font-bold text-white mb-2">帳單紀錄</h1>
      <p className="text-gray-400 mb-6">查看所有付款紀錄與交易明細。</p>

      {loading ? (
        <div className="text-gray-400 text-center py-12">載入中...</div>
      ) : records.length === 0 ? (
        <div className="text-center py-12 text-gray-500 bg-gray-900/50 rounded-2xl border border-gray-800">
          <p className="text-4xl mb-3">🧾</p>
          <p>尚無帳單紀錄</p>
          <Link href="/pricing" className="text-blue-400 hover:text-blue-300 text-sm mt-2 inline-block">
            前往訂閱 →
          </Link>
        </div>
      ) : (
        <div className="bg-gray-900/50 border border-gray-800 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800 text-gray-500">
                  <th className="text-left px-5 py-3 font-medium">日期</th>
                  <th className="text-left px-5 py-3 font-medium">類型</th>
                  <th className="text-left px-5 py-3 font-medium">方案</th>
                  <th className="text-right px-5 py-3 font-medium">金額</th>
                  <th className="text-center px-5 py-3 font-medium">狀態</th>
                  <th className="text-left px-5 py-3 font-medium">交易編號</th>
                </tr>
              </thead>
              <tbody>
                {records.map((record) => {
                  const status = STATUS_MAP[record.status] || { label: record.status, color: "text-gray-400" };
                  const planName = PLANS[record.planId]?.name || record.planId;

                  return (
                    <tr key={record.id} className="border-b border-gray-800/50 hover:bg-gray-800/20">
                      <td className="px-5 py-3 text-gray-300">
                        {new Date(record.createdAt).toLocaleDateString("zh-TW")}
                      </td>
                      <td className="px-5 py-3 text-gray-400">
                        {TYPE_MAP[record.paymentType] || record.paymentType}
                      </td>
                      <td className="px-5 py-3 text-white">{planName}</td>
                      <td className="px-5 py-3 text-right text-white font-medium">
                        NT${record.amount.toLocaleString()}
                      </td>
                      <td className="px-5 py-3 text-center">
                        <span className={`text-xs font-medium ${status.color}`}>{status.label}</span>
                      </td>
                      <td className="px-5 py-3 text-gray-500 text-xs font-mono">
                        {record.ecpayTradeNo || record.ecpayMerchantTradeNo}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
