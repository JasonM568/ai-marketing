"use client";

import Link from "next/link";
import ScrollAnimationWrapper from "./ScrollAnimationWrapper";

export default function CTASection() {
  return (
    <section className="py-20 lg:py-32 px-4 relative overflow-hidden">
      {/* Gradient background layers */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900/30 via-gray-950 to-purple-900/20" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-600/15 rounded-full blur-[120px]" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-purple-600/10 rounded-full blur-[80px]" />

      <div className="max-w-3xl mx-auto text-center relative z-10">
        <ScrollAnimationWrapper>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6 leading-tight">
            準備好讓 AI 提升你的行銷效率了嗎？
          </h2>
          <p className="text-gray-400 text-lg mb-10">
            立即開始免費試用，體驗 AI 行銷的無限可能
          </p>
          <Link
            href="/login"
            className="inline-block px-10 py-4 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white text-lg font-semibold rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-blue-600/25 active:scale-100"
          >
            免費開始使用 &rarr;
          </Link>
          <p className="mt-6 text-xs text-gray-500">
            不需要信用卡 &middot; 免費方案可用 &middot; 隨時取消
          </p>
        </ScrollAnimationWrapper>
      </div>
    </section>
  );
}
