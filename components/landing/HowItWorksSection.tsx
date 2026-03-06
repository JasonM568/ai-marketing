"use client";

import ScrollAnimationWrapper from "./ScrollAnimationWrapper";

const steps = [
  {
    number: "01",
    icon: "🏢",
    title: "建立品牌",
    description: "設定品牌名稱、風格語調，AI 會自動學習你的品牌個性。",
  },
  {
    number: "02",
    icon: "✨",
    title: "AI 產出內容",
    description: "選擇助理類型，一鍵生成符合品牌調性的社群貼文。",
  },
  {
    number: "03",
    icon: "🚀",
    title: "排程自動發布",
    description: "設定發文時間，系統自動發布到 FB、IG、Threads。",
  },
];

export default function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-20 lg:py-32 px-4">
      <div className="max-w-6xl mx-auto">
        <ScrollAnimationWrapper>
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-full text-sm text-blue-400 mb-4">
              簡單流程
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-white">
              三步驟開始 AI 行銷
            </h2>
          </div>
        </ScrollAnimationWrapper>

        {/* Desktop: horizontal timeline */}
        <div className="hidden lg:block relative">
          {/* Connection line */}
          <div className="absolute top-[60px] left-[16.67%] right-[16.67%] h-px bg-gradient-to-r from-blue-500/50 via-blue-400/50 to-blue-500/50" />

          <div className="grid grid-cols-3 gap-8">
            {steps.map((step, i) => (
              <ScrollAnimationWrapper key={i} delay={i * 0.15}>
                <div className="text-center relative">
                  {/* Step circle */}
                  <div className="w-[120px] h-[120px] mx-auto mb-6 rounded-2xl bg-gradient-to-br from-blue-600/20 to-purple-600/20 border border-white/10 flex items-center justify-center relative z-10">
                    <span className="text-4xl">{step.icon}</span>
                  </div>

                  {/* Step number */}
                  <span className="text-xs font-mono text-blue-400 tracking-wider mb-2 block">
                    STEP {step.number}
                  </span>

                  <h3 className="text-xl font-bold text-white mb-3">
                    {step.title}
                  </h3>
                  <p className="text-gray-400 text-sm leading-relaxed max-w-xs mx-auto">
                    {step.description}
                  </p>
                </div>
              </ScrollAnimationWrapper>
            ))}
          </div>
        </div>

        {/* Mobile: vertical steps */}
        <div className="lg:hidden space-y-8">
          {steps.map((step, i) => (
            <ScrollAnimationWrapper key={i} delay={i * 0.1}>
              <div className="flex gap-5">
                {/* Left: icon + line */}
                <div className="flex flex-col items-center">
                  <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-blue-600/20 to-purple-600/20 border border-white/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-2xl">{step.icon}</span>
                  </div>
                  {i < steps.length - 1 && (
                    <div className="w-px flex-1 bg-gradient-to-b from-blue-500/30 to-transparent mt-3" />
                  )}
                </div>

                {/* Right: content */}
                <div className="pt-2 pb-4">
                  <span className="text-xs font-mono text-blue-400 tracking-wider">
                    STEP {step.number}
                  </span>
                  <h3 className="text-lg font-bold text-white mt-1 mb-2">
                    {step.title}
                  </h3>
                  <p className="text-gray-400 text-sm leading-relaxed">
                    {step.description}
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
