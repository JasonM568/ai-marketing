"use client";

import ScrollAnimationWrapper from "./ScrollAnimationWrapper";

const features = [
  {
    icon: "✨",
    title: "AI 內容產出",
    description:
      "8 種 AI 助理幫你寫出吸睛文案，從產品推廣到品牌故事，一鍵生成專業內容。",
    color: "from-blue-500/20 to-blue-600/10",
  },
  {
    icon: "📅",
    title: "多平台排程發文",
    description:
      "支援 Facebook、Instagram、Threads 三大平台，設定時間自動發布，不用再手動貼文。",
    color: "from-purple-500/20 to-purple-600/10",
  },
  {
    icon: "💬",
    title: "AI 留言自動回覆",
    description:
      "24/7 智慧回覆粉絲留言，根據品牌調性自動生成回覆，提升互動率。",
    color: "from-green-500/20 to-green-600/10",
  },
  {
    icon: "🎯",
    title: "品牌聲音管理",
    description:
      "建立專屬品牌語調，讓每篇貼文都保持一致的品牌風格與個性。",
    color: "from-orange-500/20 to-orange-600/10",
  },
  {
    icon: "📊",
    title: "策略分析建議",
    description:
      "AI 分析你的產業趨勢，提供最佳發文策略和內容方向建議。",
    color: "from-pink-500/20 to-pink-600/10",
  },
  {
    icon: "📂",
    title: "完整內容工作區",
    description:
      "所有內容集中管理，支援編輯、預覽、歷史紀錄，團隊協作更高效。",
    color: "from-cyan-500/20 to-cyan-600/10",
  },
];

export default function FeaturesSection() {
  return (
    <section id="features" className="py-20 lg:py-32 px-4">
      <div className="max-w-6xl mx-auto">
        <ScrollAnimationWrapper>
          <div className="text-center mb-14">
            <span className="inline-block px-4 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-full text-sm text-blue-400 mb-4">
              核心功能
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              一站式 AI 行銷平台
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              從內容產出到自動發布，全方位提升你的社群行銷效率
            </p>
          </div>
        </ScrollAnimationWrapper>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, i) => (
            <ScrollAnimationWrapper key={i} delay={i * 0.08}>
              <div className="group relative bg-gray-900/50 border border-white/10 rounded-2xl p-6 lg:p-8 h-full transition-all hover:border-white/20 hover:bg-gray-900/70">
                {/* Gradient background on hover */}
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${feature.color} rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
                />

                <div className="relative z-10">
                  {/* Icon */}
                  <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mb-5">
                    <span className="text-2xl">{feature.icon}</span>
                  </div>

                  <h3 className="text-lg font-bold text-white mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-gray-400 text-sm leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            </ScrollAnimationWrapper>
          ))}
        </div>
      </div>
    </section>
  );
}
