"use client";

import ScrollAnimationWrapper from "./ScrollAnimationWrapper";

const testimonials = [
  {
    quote:
      "使用 AI Marketing Agent 後，我們的社群內容產出效率提升了 3 倍，品質也更一致。",
    name: "陳小姐",
    role: "電商品牌行銷主管",
    avatar: "👩‍💼",
  },
  {
    quote:
      "排程發文功能讓我不用每天盯著手機，週末也能自動發文。太方便了！",
    name: "林先生",
    role: "個人品牌經營者",
    avatar: "👨‍💻",
  },
  {
    quote:
      "AI 留言回覆幫我們省下大量客服時間，粉絲滿意度明顯提升。",
    name: "張先生",
    role: "餐飲品牌老闆",
    avatar: "👨‍🍳",
  },
];

export default function TestimonialsSection() {
  return (
    <section className="py-20 lg:py-32 px-4">
      <div className="max-w-6xl mx-auto">
        <ScrollAnimationWrapper>
          <div className="text-center mb-14">
            <span className="inline-block px-4 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-full text-sm text-blue-400 mb-4">
              客戶好評
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-white">
              他們都在用 AI 行銷
            </h2>
          </div>
        </ScrollAnimationWrapper>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <ScrollAnimationWrapper key={i} delay={i * 0.1}>
              <div className="bg-gray-900/50 border border-white/10 rounded-2xl p-6 lg:p-8 h-full flex flex-col">
                {/* Quote mark */}
                <span className="text-3xl text-blue-500/40 mb-4">&ldquo;</span>

                <p className="text-gray-300 text-sm leading-relaxed flex-1 mb-6">
                  {t.quote}
                </p>

                <div className="flex items-center gap-3 pt-4 border-t border-white/5">
                  <span className="text-2xl w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center">
                    {t.avatar}
                  </span>
                  <div>
                    <p className="text-white text-sm font-medium">{t.name}</p>
                    <p className="text-gray-500 text-xs">{t.role}</p>
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
