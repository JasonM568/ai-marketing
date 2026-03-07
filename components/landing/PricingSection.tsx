"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { PLANS, CONTENT_COSTS } from "@/lib/plans";
import ScrollAnimationWrapper from "./ScrollAnimationWrapper";

const planOrder = ["basic", "pro", "business"] as const;

export default function PricingSection() {
  const [showCosts, setShowCosts] = useState(false);

  return (
    <section id="pricing" className="py-20 lg:py-32 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <ScrollAnimationWrapper>
          <div className="text-center mb-14">
            <span className="inline-block px-4 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-full text-sm text-blue-400 mb-4">
              方案價格
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              簡單透明的定價
            </h2>
            <p className="text-gray-400">
              所有方案皆可隨時取消，無長期合約
            </p>
          </div>
        </ScrollAnimationWrapper>

        {/* Pricing cards */}
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
                  {/* Recommended badge */}
                  {isRecommended && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-blue-600 text-white text-xs font-semibold rounded-full">
                      推薦
                    </span>
                  )}

                  {/* Plan icon + name + description */}
                  <div className="mb-6">
                    <span className="text-3xl">{plan.icon}</span>
                    <h3 className="text-xl font-bold text-white mt-3">
                      {plan.name}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {plan.description}
                    </p>
                  </div>

                  {/* Price */}
                  <div className="mb-6">
                    {plan.originalPrice > plan.price && (
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm text-gray-500 line-through">
                          NT${plan.originalPrice.toLocaleString()}
                        </span>
                        <span className="px-1.5 py-0.5 bg-red-500/15 text-red-400 text-[10px] font-semibold rounded">
                          省 ${(plan.originalPrice - plan.price).toLocaleString()}
                        </span>
                      </div>
                    )}
                    <div className="flex items-baseline gap-1">
                      <span className="text-sm text-gray-400">NT$</span>
                      <span className="text-4xl font-bold text-white">
                        {plan.price.toLocaleString()}
                      </span>
                      <span className="text-sm text-gray-500">/月</span>
                    </div>
                  </div>

                  {/* Feature list */}
                  <ul className="space-y-3 mb-8 flex-1">
                    {plan.features.map((f, fi) => (
                      <li
                        key={fi}
                        className="flex items-start gap-2.5 text-sm text-gray-300"
                      >
                        <span className="text-green-400 mt-0.5 flex-shrink-0">
                          ✓
                        </span>
                        {f}
                      </li>
                    ))}
                  </ul>

                  {/* CTA button */}
                  <Link
                    href="/login"
                    className={`block text-center py-3 rounded-xl font-medium transition-all hover:scale-[1.02] ${
                      isRecommended
                        ? "bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/20"
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

        {/* Credits cost accordion */}
        <ScrollAnimationWrapper delay={0.3}>
          <div className="mt-12 max-w-3xl mx-auto">
            <button
              onClick={() => setShowCosts(!showCosts)}
              className="w-full flex items-center justify-between px-6 py-4 bg-gray-900/50 border border-white/10 rounded-xl text-sm text-gray-300 hover:bg-gray-900/70 transition-colors group"
            >
              <span className="font-medium">點數消耗對照表</span>
              <motion.span
                animate={{ rotate: showCosts ? 180 : 0 }}
                transition={{ duration: 0.2 }}
                className="text-gray-500 group-hover:text-gray-300 transition-colors"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 20 20"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M5 7.5L10 12.5L15 7.5"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </motion.span>
            </button>

            <AnimatePresence>
              {showCosts && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  className="overflow-hidden"
                >
                  <div className="mt-2 bg-gray-900/50 border border-white/10 rounded-xl p-4 sm:p-6">
                    <div className="grid gap-3">
                      {CONTENT_COSTS.map((item) => (
                        <div
                          key={item.type}
                          className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-white/5 transition-colors"
                        >
                          <div className="flex-1 min-w-0">
                            <span className="text-sm font-medium text-white">
                              {item.label}
                            </span>
                            <span className="text-xs text-gray-500 ml-2 hidden sm:inline">
                              {item.description}
                            </span>
                            <p className="text-xs text-gray-500 sm:hidden mt-0.5">
                              {item.description}
                            </p>
                          </div>
                          <span
                            className={`flex-shrink-0 ml-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                              item.credits <= 3
                                ? "bg-green-500/15 text-green-400"
                                : item.credits <= 6
                                ? "bg-amber-500/15 text-amber-400"
                                : "bg-purple-500/15 text-purple-400"
                            }`}
                          >
                            {item.credits} 點
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </ScrollAnimationWrapper>

        {/* Footer note */}
        <ScrollAnimationWrapper delay={0.4}>
          <p className="text-center text-xs text-gray-600 mt-8">
            訂閱採月繳制，使用信用卡透過綠界科技安全扣款。
          </p>
        </ScrollAnimationWrapper>
      </div>
    </section>
  );
}
