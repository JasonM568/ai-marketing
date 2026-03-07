"use client";

import ScrollAnimationWrapper from "./ScrollAnimationWrapper";

const steps = [
  {
    number: "01",
    icon: "🏢",
    title: "建立品牌",
    description: "設定品牌名稱、風格語調，AI 自動學習你的品牌個性",
    gradient: "from-blue-500 to-cyan-400",
  },
  {
    number: "02",
    icon: "✨",
    title: "AI 產出內容",
    description: "選擇助理類型，一鍵生成符合品牌調性的社群貼文",
    gradient: "from-purple-500 to-pink-400",
  },
  {
    number: "03",
    icon: "🚀",
    title: "排程自動發布",
    description: "設定發文時間，系統自動發布到 FB、IG、Threads",
    gradient: "from-amber-500 to-orange-400",
  },
];

export default function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-20 lg:py-32 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <ScrollAnimationWrapper>
          <div className="text-center mb-16 lg:mb-20">
            <span className="inline-block px-4 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-full text-sm text-blue-400 mb-4">
              簡單流程
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-white">
              三步驟開始 AI 行銷
            </h2>
          </div>
        </ScrollAnimationWrapper>

        {/* Desktop: horizontal timeline */}
        <div className="hidden lg:block">
          <div className="grid grid-cols-3 gap-8 relative">
            {/* Connection lines between circles */}
            <div className="absolute top-10 left-[calc(16.67%+2.5rem)] right-[calc(16.67%+2.5rem)] flex items-center z-0">
              <div className="flex-1 border-t-2 border-dashed border-blue-500/30" />
              <div className="w-2 h-2 rounded-full bg-blue-500/40 mx-1" />
              <div className="flex-1 border-t-2 border-dashed border-purple-500/30" />
            </div>

            {steps.map((step, i) => (
              <ScrollAnimationWrapper key={i} delay={i * 0.15}>
                <div className="text-center relative z-10">
                  {/* Circular icon area */}
                  <div className="mx-auto mb-6 relative">
                    {/* Gradient border ring */}
                    <div
                      className={`w-20 h-20 mx-auto rounded-full bg-gradient-to-br ${step.gradient} p-[2px]`}
                    >
                      <div className="w-full h-full rounded-full bg-gray-950 flex items-center justify-center">
                        <span className="text-3xl">{step.icon}</span>
                      </div>
                    </div>
                  </div>

                  {/* Step label */}
                  <span className="inline-block text-xs font-mono text-blue-400 tracking-widest uppercase mb-2">
                    Step {step.number}
                  </span>

                  {/* Title */}
                  <h3 className="text-xl font-bold text-white mb-3">
                    {step.title}
                  </h3>

                  {/* Description */}
                  <p className="text-gray-400 text-sm leading-relaxed max-w-xs mx-auto">
                    {step.description}
                  </p>
                </div>
              </ScrollAnimationWrapper>
            ))}
          </div>
        </div>

        {/* Mobile: vertical timeline */}
        <div className="lg:hidden space-y-2">
          {steps.map((step, i) => (
            <ScrollAnimationWrapper key={i} delay={i * 0.1}>
              <div className="flex gap-5">
                {/* Left: timeline dot + line */}
                <div className="flex flex-col items-center">
                  {/* Gradient circle */}
                  <div
                    className={`w-14 h-14 rounded-full bg-gradient-to-br ${step.gradient} p-[2px] flex-shrink-0`}
                  >
                    <div className="w-full h-full rounded-full bg-gray-950 flex items-center justify-center">
                      <span className="text-xl">{step.icon}</span>
                    </div>
                  </div>
                  {/* Connecting line */}
                  {i < steps.length - 1 && (
                    <div className="w-px flex-1 min-h-[2rem] bg-gradient-to-b from-blue-500/30 to-transparent mt-2" />
                  )}
                </div>

                {/* Right: content */}
                <div className="pt-1 pb-6">
                  <span className="text-xs font-mono text-blue-400 tracking-widest uppercase">
                    Step {step.number}
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
