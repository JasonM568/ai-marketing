"use client";

import Link from "next/link";
import { motion } from "framer-motion";

const heroStats = [
  { value: "1,000+", label: "篇內容已產出" },
  { value: "80%", label: "時間節省" },
  { value: "3", label: "大平台整合" },
];

export default function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center px-4 pt-20 pb-16 overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0">
        {/* Main gradient blob */}
        <div
          className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/15 rounded-full blur-[120px]"
          style={{ animation: "glow-pulse 4s ease-in-out infinite" }}
        />
        {/* Secondary blob */}
        <div
          className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-purple-600/10 rounded-full blur-[100px]"
          style={{ animation: "glow-pulse 5s ease-in-out infinite 1s" }}
        />
        {/* Grid pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />
      </div>

      <div className="max-w-4xl mx-auto text-center relative z-10">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <span className="inline-block px-4 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-full text-sm text-blue-400 mb-6">
            🚀 AI 驅動行銷新時代
          </span>
        </motion.div>

        {/* Main heading */}
        <motion.h1
          className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          讓 AI 幫你寫文案
          <br />
          <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            排貼文、回留言
          </span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          className="text-lg sm:text-xl text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          一站式管理 Facebook、Instagram、Threads
          <br className="hidden sm:block" />
          節省 80% 行銷時間，讓你專注在真正重要的事
        </motion.p>

        {/* CTA buttons */}
        <motion.div
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Link
            href="/login"
            className="w-full sm:w-auto px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white text-lg font-semibold rounded-xl transition-all hover:scale-105 hover:shadow-lg hover:shadow-blue-600/25"
          >
            免費開始使用
          </Link>
          <a
            href="#features"
            className="w-full sm:w-auto px-8 py-4 bg-white/5 hover:bg-white/10 text-white text-lg font-medium rounded-xl border border-white/10 transition-all"
          >
            了解更多 ↓
          </a>
        </motion.div>

        {/* Stats strip */}
        <motion.div
          className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          {heroStats.map((stat, i) => (
            <div key={i} className="flex items-center gap-3">
              <span className="text-2xl font-bold text-white">
                {stat.value}
              </span>
              <span className="text-sm text-gray-500">{stat.label}</span>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
