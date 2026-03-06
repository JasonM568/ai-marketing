"use client";

import { useState, useEffect } from "react";
import { PLANS } from "@/lib/plans";

interface SubscriptionInfo {
  id: string;
  planId: string;
  status: string;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
}

export default function PricingPage() {
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkingOut, setCheckingOut] = useState<string | null>(null);

  useEffect(() => {
    fetchSubscription();
  }, []);

  async function fetchSubscription() {
    try {
      const res = await fetch("/api/subscription", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setSubscription(data.subscription);
      }
    } catch (err) {
      console.error("Fetch subscription error:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleCheckout(planId: string) {
    setCheckingOut(planId);
    try {
      const res = await fetch("/api/subscription/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ planId }),
      });

      if (res.ok) {
        // Response is HTML form that auto-submits to ECPay
        const html = await res.text();
        const newWindow = document.open();
        newWindow?.write(html);
        newWindow?.close();
      } else {
        const data = await res.json();
        alert(data.error || "建立訂閱失敗");
      }
    } catch (err) {
      console.error("Checkout error:", err);
      alert("發生錯誤");
    } finally {
      setCheckingOut(null);
    }
  }

  const planList = Object.values(PLANS);
  const isActive = subscription?.status === "active";
  const currentPlanId = subscription?.planId;

  return (
    <div className="max-w-5xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold text-white mb-2">方案價格</h1>
      <p className="text-gray-400 mb-8">選擇適合您的訂閱方案，立即開始使用 AI 行銷助手。</p>

      {loading ? (
        <div className="text-gray-400 text-center py-12">載入中...</div>
      ) : (
        <>
          {/* Plan cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {planList.map((plan) => {
              const isCurrent = isActive && currentPlanId === plan.id;
              const isPro = plan.id === "pro";

              return (
                <div
                  key={plan.id}
                  className={`relative bg-gray-900/50 border rounded-2xl p-6 flex flex-col ${
                    isPro
                      ? "border-blue-500/50 ring-1 ring-blue-500/20"
                      : "border-gray-800"
                  }`}
                >
                  {isPro && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-blue-600 text-white text-xs rounded-full font-medium">
                      推薦
                    </div>
                  )}

                  <div className="text-3xl mb-3">{plan.icon}</div>
                  <h3 className="text-xl font-bold text-white mb-1">{plan.name}</h3>
                  <p className="text-sm text-gray-400 mb-4">{plan.description}</p>

                  <div className="mb-6">
                    <span className="text-3xl font-bold text-white">NT${plan.price.toLocaleString()}</span>
                    <span className="text-gray-500 text-sm">/月</span>
                  </div>

                  <ul className="space-y-2 mb-6 flex-1">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                        <span className="text-green-400 mt-0.5">✓</span>
                        {feature}
                      </li>
                    ))}
                  </ul>

                  {isCurrent ? (
                    <button
                      disabled
                      className="w-full py-3 rounded-xl bg-green-900/30 text-green-400 font-medium text-sm cursor-default"
                    >
                      ✅ 目前方案
                    </button>
                  ) : isActive ? (
                    <button
                      disabled
                      className="w-full py-3 rounded-xl bg-gray-800 text-gray-500 font-medium text-sm cursor-not-allowed"
                    >
                      請先取消目前訂閱
                    </button>
                  ) : (
                    <button
                      onClick={() => handleCheckout(plan.id)}
                      disabled={checkingOut !== null}
                      className={`w-full py-3 rounded-xl font-medium text-sm transition-colors disabled:opacity-50 ${
                        isPro
                          ? "bg-blue-600 hover:bg-blue-500 text-white"
                          : "bg-gray-800 hover:bg-gray-700 text-white"
                      }`}
                    >
                      {checkingOut === plan.id ? "處理中..." : "立即訂閱"}
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {/* Current subscription info */}
          {subscription && subscription.status === "active" && (
            <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6">
              <h2 className="text-lg font-semibold text-white mb-3">目前訂閱</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">方案</p>
                  <p className="text-white font-medium">{PLANS[subscription.planId]?.name || subscription.planId}</p>
                </div>
                <div>
                  <p className="text-gray-500">狀態</p>
                  <p className="text-green-400 font-medium">
                    {subscription.cancelAtPeriodEnd ? "到期後取消" : "使用中"}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">目前期間結束</p>
                  <p className="text-white font-medium">
                    {subscription.currentPeriodEnd
                      ? new Date(subscription.currentPeriodEnd).toLocaleDateString("zh-TW")
                      : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">管理</p>
                  <div className="flex gap-2">
                    <a href="/billing" className="text-blue-400 hover:text-blue-300 text-sm">
                      帳單紀錄 →
                    </a>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Info */}
          <div className="mt-6 px-4 py-3 bg-gray-900/30 border border-gray-800 rounded-xl text-gray-500 text-xs">
            <p>💡 訂閱採月繳制，使用信用卡透過綠界科技安全扣款。訂閱後可隨時取消，取消後至期滿前仍可繼續使用。</p>
          </div>
        </>
      )}
    </div>
  );
}
