"use client";

import Link from "next/link";
import { motion } from "framer-motion";

export default function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center px-4 sm:px-6 pt-20 pb-16 overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute top-1/4 left-1/3 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-blue-600/12 rounded-full blur-[140px]"
          style={{ animation: "glow-pulse 4s ease-in-out infinite" }}
        />
        <div
          className="absolute bottom-1/3 right-1/4 w-[500px] h-[500px] bg-purple-600/8 rounded-full blur-[120px]"
          style={{ animation: "glow-pulse 5s ease-in-out infinite 1s" }}
        />
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />
      </div>

      <div className="max-w-7xl mx-auto w-full relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left: Text content */}
          <div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-full text-sm text-blue-400 mb-6">
                <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse" />
                AI 驅動社群行銷自動化
              </span>
            </motion.div>

            <motion.h1
              className="text-4xl sm:text-5xl lg:text-[3.5rem] font-bold text-white mb-6 leading-[1.15] tracking-tight"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              讓 AI 幫你經營社群
              <br />
              <span className="bg-gradient-to-r from-blue-400 via-blue-300 to-purple-400 bg-clip-text text-transparent">
                從文案到發文全自動
              </span>
            </motion.h1>

            <motion.p
              className="text-lg text-gray-400 mb-8 max-w-lg leading-relaxed"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              一站式管理 Facebook、Instagram、Threads。
              <br className="hidden sm:block" />
              AI 自動寫文案、排程發文、智慧回覆留言，節省 80% 行銷時間。
            </motion.p>

            <motion.div
              className="flex flex-col sm:flex-row items-start gap-4 mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <Link
                href="/login"
                className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white text-base font-semibold rounded-xl transition-all hover:scale-105 hover:shadow-xl hover:shadow-blue-600/25 text-center"
              >
                免費開始使用
              </Link>
              <a
                href="#features"
                className="w-full sm:w-auto px-8 py-4 bg-white/5 hover:bg-white/10 text-white text-base font-medium rounded-xl border border-white/10 hover:border-white/20 transition-all text-center"
              >
                了解更多 ↓
              </a>
            </motion.div>

            <motion.div
              className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-gray-500"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              {["不用綁定信用卡", "免費方案可用", "台灣在地服務"].map((text) => (
                <span key={text} className="flex items-center gap-1.5">
                  <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  {text}
                </span>
              ))}
            </motion.div>
          </div>

          {/* Right: Dashboard Mockup */}
          <motion.div
            className="relative hidden lg:block"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
          >
            <div className="relative">
              {/* Main dashboard card */}
              <div className="bg-gray-900/80 border border-white/10 rounded-2xl p-5 shadow-2xl shadow-black/40 backdrop-blur-sm">
                {/* Title bar */}
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-500/60" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                    <div className="w-3 h-3 rounded-full bg-green-500/60" />
                  </div>
                  <div className="flex-1 h-6 bg-gray-800 rounded-lg mx-8" />
                </div>

                {/* Content area */}
                <div className="space-y-3">
                  {/* Schedule post preview */}
                  <div className="bg-gray-800/60 border border-white/5 rounded-xl p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-8 h-8 bg-blue-600/20 rounded-lg flex items-center justify-center text-xs">📅</div>
                      <div>
                        <div className="text-xs font-medium text-white">排程貼文</div>
                        <div className="text-[10px] text-gray-500">今天 18:00 · Facebook + Instagram</div>
                      </div>
                      <div className="ml-auto px-2 py-0.5 bg-green-500/10 border border-green-500/20 rounded text-[10px] text-green-400">已排程</div>
                    </div>
                    <div className="text-xs text-gray-400 leading-relaxed">
                      新品上市！我們最新的春季系列已經準備好迎接你了...
                    </div>
                  </div>

                  {/* AI chat preview */}
                  <div className="bg-gray-800/60 border border-white/5 rounded-xl p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-8 h-8 bg-purple-600/20 rounded-lg flex items-center justify-center text-xs">✨</div>
                      <div className="text-xs font-medium text-white">AI 助理回覆</div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <div className="w-5 h-5 bg-gray-700 rounded-full flex-shrink-0 flex items-center justify-center text-[8px]">👤</div>
                        <div className="bg-gray-700/50 rounded-lg px-3 py-1.5 text-[11px] text-gray-300">請問這個有什麼顏色？</div>
                      </div>
                      <div className="flex gap-2 justify-end">
                        <div className="bg-blue-600/20 border border-blue-500/20 rounded-lg px-3 py-1.5 text-[11px] text-blue-300">
                          您好！目前有白色、黑色、粉色三種選擇 ✨
                        </div>
                        <div className="w-5 h-5 bg-blue-600/30 rounded-full flex-shrink-0 flex items-center justify-center text-[8px]">🤖</div>
                      </div>
                    </div>
                  </div>

                  {/* Platform stats bar */}
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: "Facebook", color: "bg-blue-600/20 text-blue-400 border-blue-500/20" },
                      { label: "Instagram", color: "bg-pink-600/20 text-pink-400 border-pink-500/20" },
                      { label: "Threads", color: "bg-gray-600/30 text-gray-300 border-gray-500/20" },
                    ].map((p) => (
                      <div key={p.label} className={`${p.color} border rounded-lg px-3 py-2 text-center`}>
                        <div className="text-xs font-medium">{p.label}</div>
                        <div className="text-[10px] opacity-60 mt-0.5">已連結</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Floating notification card */}
              <div
                className="absolute -top-4 -right-4 bg-gray-900 border border-white/10 rounded-xl p-3 shadow-xl shadow-black/30"
                style={{ animation: "float 3s ease-in-out infinite" }}
              >
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-green-500/20 rounded-full flex items-center justify-center">
                    <svg className="w-3 h-3 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-[10px] font-medium text-white">貼文已發布</div>
                    <div className="text-[9px] text-gray-500">剛剛 · Instagram</div>
                  </div>
                </div>
              </div>

              {/* Floating AI badge */}
              <div
                className="absolute -bottom-3 -left-4 bg-gray-900 border border-white/10 rounded-xl px-3 py-2 shadow-xl shadow-black/30"
                style={{ animation: "float 4s ease-in-out infinite 1s" }}
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm">⚡</span>
                  <span className="text-[10px] font-medium text-white">AI 產出 3 篇文案</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
