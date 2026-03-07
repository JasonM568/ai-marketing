"use client";

import ScrollAnimationWrapper from "./ScrollAnimationWrapper";

const painPoints = [
  {
    icon: "\u23F0",
    problem: "每天花數小時寫社群貼文",
    detail: "想破頭也寫不出好文案，花了大量時間卻效果不佳",
    solution: "AI 助理秒生成專業文案",
  },
  {
    icon: "\uD83D\uDCF1",
    problem: "多平台管理混亂",
    detail: "FB、IG、Threads 分別登入、手動貼文，流程繁瑣",
    solution: "一站式排程，三平台同步發布",
  },
  {
    icon: "\uD83D\uDCAC",
    problem: "留言回覆不及時",
    detail: "粉絲留言太多來不及回，錯過互動黃金時間",
    solution: "AI 24/7 自動回覆，不漏接任何留言",
  },
];

export default function PainPointsSection() {
  return (
    <section className="py-20 lg:py-32 px-4 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-red-950/5 to-transparent" />

      <div className="max-w-6xl mx-auto relative z-10">
        <ScrollAnimationWrapper>
          <div className="text-center mb-14">
            <span className="inline-block px-4 py-1.5 bg-red-500/10 border border-red-500/20 rounded-full text-sm text-red-400 mb-4">
              行銷痛點
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-white">
              社群行銷的三大挑戰
            </h2>
          </div>
        </ScrollAnimationWrapper>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {painPoints.map((item, i) => (
            <ScrollAnimationWrapper key={i} delay={i * 0.12}>
              <div className="rounded-2xl overflow-hidden transition-transform duration-300 hover:scale-[1.02]">
                {/* Problem half */}
                <div className="bg-red-500/5 border border-red-500/10 rounded-t-2xl p-6 lg:p-8">
                  <span className="text-3xl mb-3 block">{item.icon}</span>
                  <h3 className="text-lg font-bold text-white mb-2">
                    {item.problem}
                  </h3>
                  <p className="text-gray-500 text-sm leading-relaxed">
                    {item.detail}
                  </p>
                </div>

                {/* Solution half */}
                <div className="bg-green-500/5 border border-green-500/10 border-t-0 rounded-b-2xl p-6 lg:p-8">
                  <div className="flex items-start gap-2.5">
                    <svg
                      className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="m4.5 12.75 6 6 9-13.5"
                      />
                    </svg>
                    <span className="text-sm text-green-400 font-medium leading-relaxed">
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
