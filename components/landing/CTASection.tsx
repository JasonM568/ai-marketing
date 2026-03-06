"use client";

import Link from "next/link";
import ScrollAnimationWrapper from "./ScrollAnimationWrapper";

export default function CTASection() {
  return (
    <section className="py-20 lg:py-32 px-4 relative overflow-hidden">
      {/* Gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900/30 via-gray-900 to-purple-900/20" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-3xl" />

      <div className="max-w-3xl mx-auto text-center relative z-10">
        <ScrollAnimationWrapper>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6 leading-tight">
            準備好讓 AI 助你
            <br />
            提升行銷效率了嗎？
          </h2>
          <p className="text-gray-400 text-lg mb-10">
            立即開始免費試用，體驗 AI 行銷的無限可能
          </p>
          <Link
            href="/login"
            className="inline-block px-10 py-4 bg-blue-600 hover:bg-blue-500 text-white text-lg font-semibold rounded-xl transition-all hover:scale-105 hover:shadow-lg hover:shadow-blue-600/25"
          >
            免費開始使用 →
          </Link>
        </ScrollAnimationWrapper>
      </div>
    </section>
  );
}
