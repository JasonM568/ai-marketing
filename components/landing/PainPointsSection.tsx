"use client";

import ScrollAnimationWrapper from "./ScrollAnimationWrapper";

const painPoints = [
  {
    icon: "⏰",
    problem: "每天花數小時寫社群貼文",
    detail: "想破頭也寫不出好文案，花了大量時間卻效果不佳。",
    solution: "AI 助理幫你秒生成專業貼文",
  },
  {
    icon: "📱",
    problem: "多平台管理混亂",
    detail: "FB、IG、Threads 分別登入、手動貼文，流程繁瑣容易出錯。",
    solution: "一站式排程，三大平台同步發布",
  },
  {
    icon: "💬",
    problem: "留言回覆不及時",
    detail: "粉絲留言太多來不及回，錯過互動黃金時間。",
    solution: "AI 24/7 自動回覆，不漏接每則留言",
  },
];

export default function PainPointsSection() {
  return (
    <section className="py-20 lg:py-32 px-4 relative">
      {/* Subtle background */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-red-950/5 to-transparent" />

      <div className="max-w-6xl mx-auto relative z-10">
        <ScrollAnimationWrapper>
          <div className="text-center mb-14">
            <span className="inline-block px-4 py-1.5 bg-red-500/10 border border-red-500/20 rounded-full text-sm text-red-400 mb-4">
              行銷痛點
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-white">
              您是否也遇到這些問題？
            </h2>
          </div>
        </ScrollAnimationWrapper>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {painPoints.map((item, i) => (
            <ScrollAnimationWrapper key={i} delay={i * 0.1}>
              <div className="bg-gray-900/50 border border-white/10 rounded-2xl p-6 lg:p-8 h-full flex flex-col">
                {/* Pain icon */}
                <span className="text-4xl mb-4">{item.icon}</span>

                {/* Problem */}
                <h3 className="text-lg font-bold text-white mb-2">
                  {item.problem}
                </h3>
                <p className="text-gray-500 text-sm leading-relaxed mb-5 flex-1">
                  {item.detail}
                </p>

                {/* Solution arrow */}
                <div className="pt-4 border-t border-white/5">
                  <div className="flex items-center gap-2">
                    <span className="text-green-400 text-sm">✓</span>
                    <span className="text-sm text-green-400/90 font-medium">
                      {item.solution}
                    </span>
                  </div>
                </div>
              </div>
            </ScrollAnimationWrapper>
          ))}
        </div>
      </div>
    </section>
  );
}
