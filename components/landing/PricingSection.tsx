"use client";

import Link from "next/link";
import { PLANS } from "@/lib/plans";
import ScrollAnimationWrapper from "./ScrollAnimationWrapper";

const planOrder = ["basic", "pro", "business"] as const;

export default function PricingSection() {
  return (
    <section id="pricing" className="py-20 lg:py-32 px-4">
      <div className="max-w-6xl mx-auto">
        <ScrollAnimationWrapper>
          <div className="text-center mb-14">
            <span className="inline-block px-4 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-full text-sm text-blue-400 mb-4">
              方案價格
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              選擇適合您的方案
            </h2>
            <p className="text-gray-400">
              所有方案皆可隨時取消，無長期合約束縛
            </p>
          </div>
        </ScrollAnimationWrapper>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {planOrder.map((key, i) => {
            const plan = PLANS[key];
            const isRecommended = key === "pro";

            return (
              <ScrollAnimationWrapper key={key} delay={i * 0.1}>
                <div
                  className={`relative rounded-2xl p-6 lg:p-8 h-full flex flex-col ${
                    isRecommended
                      ? "bg-blue-600/10 border-2 border-blue-500/40 shadow-lg shadow-blue-500/10"
                      : "bg-gray-900/50 border border-white/10"
                  }`}
                >
                  {isRecommended && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-blue-600 text-white text-xs font-semibold rounded-full">
                      推薦
                    </span>
                  )}

                  <div className="mb-6">
                    <span className="text-3xl">{plan.icon}</span>
                    <h3 className="text-xl font-bold text-white mt-3">
                      {plan.name}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {plan.description}
                    </p>
                  </div>

                  <div className="mb-6">
                    <div className="flex items-baseline gap-1">
                      <span className="text-sm text-gray-400">NT$</span>
                      <span className="text-4xl font-bold text-white">
                        {plan.price.toLocaleString()}
                      </span>
                      <span className="text-sm text-gray-500">/月</span>
                    </div>
                  </div>

                  <ul className="space-y-3 mb-8 flex-1">
                    {plan.features.map((f, fi) => (
                      <li
                        key={fi}
                        className="flex items-start gap-2 text-sm text-gray-300"
                      >
                        <span className="text-green-400 mt-0.5">✓</span>
                        {f}
                      </li>
                    ))}
                  </ul>

                  <Link
                    href="/login"
                    className={`block text-center py-3 rounded-xl font-medium transition-all hover:scale-[1.02] ${
                      isRecommended
                        ? "bg-blue-600 hover:bg-blue-500 text-white"
                        : "bg-white/5 hover:bg-white/10 text-white border border-white/10"
                    }`}
                  >
                    立即訂閱
                  </Link>
                </div>
              </ScrollAnimationWrapper>
            );
          })}
        </div>

        <ScrollAnimationWrapper delay={0.3}>
          <p className="text-center text-xs text-gray-600 mt-8">
            💡 訂閱採月繳制，使用信用卡透過綠界科技安全扣款。
          </p>
        </ScrollAnimationWrapper>
      </div>
    </section>
  );
}
