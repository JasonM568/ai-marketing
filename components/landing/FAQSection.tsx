"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ScrollAnimationWrapper from "./ScrollAnimationWrapper";

const faqs = [
  {
    q: "什麼是點數？怎麼計算？",
    a: "點數是使用 AI 功能的計量單位。不同類型的內容消耗不同點數：社群貼文 1 點、廣告文案 2 點、EDM 3 點、部落格 4 點、策略分析 5 點。每月點數會依方案自動補充。",
  },
  {
    q: "支援哪些社群平台？",
    a: "目前支援 Facebook 粉絲專頁、Instagram 商業帳號和 Threads。透過 Meta 官方 API 安全連結，您可以直接排程發布內容到這三個平台。",
  },
  {
    q: "AI 產出的內容品質如何？",
    a: "我們使用最先進的 AI 模型（Claude），並結合您的品牌資料與調性設定，產出高品質的行銷內容。所有內容在發布前都可以審閱和修改。",
  },
  {
    q: "可以隨時取消訂閱嗎？",
    a: "可以，所有方案都可以隨時取消。取消後在當期結束前仍可繼續使用所有功能，不會額外收費。",
  },
  {
    q: "未使用的點數會過期嗎？",
    a: "點數可累積，最多保留兩個月的額度。建議定期使用以發揮最大效益。",
  },
  {
    q: "如何連結社群帳號？",
    a: "訂閱後進入品牌管理頁面，點擊「連結社群帳號」即可透過 Meta OAuth 安全授權。整個過程只需幾分鐘，無需提供密碼。",
  },
];

function ChevronIcon({ isOpen }: { isOpen: boolean }) {
  return (
    <motion.div
      animate={{ rotate: isOpen ? 180 : 0 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="flex-shrink-0 text-gray-500 group-hover:text-white transition-colors"
    >
      <svg
        className="w-5 h-5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M19 9l-7 7-7-7"
        />
      </svg>
    </motion.div>
  );
}

function FAQItem({
  faq,
  index,
  isOpen,
  onToggle,
}: {
  faq: { q: string; a: string };
  index: number;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="bg-gray-900/50 border border-white/10 rounded-xl overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-6 py-5 text-left group"
        aria-expanded={isOpen}
        aria-controls={`faq-answer-${index}`}
      >
        <span className="text-sm sm:text-base font-medium text-white pr-4">
          {faq.q}
        </span>
        <ChevronIcon isOpen={isOpen} />
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            id={`faq-answer-${index}`}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <p className="px-6 pb-5 text-sm text-gray-400 leading-relaxed">
              {faq.a}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const leftColumn = faqs.filter((_, i) => i % 2 === 0);
  const rightColumn = faqs.filter((_, i) => i % 2 === 1);

  const handleToggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section id="faq" className="py-20 lg:py-32 px-4">
      <div className="max-w-5xl mx-auto">
        <ScrollAnimationWrapper>
          <div className="text-center mb-14">
            <span className="inline-block px-4 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-full text-sm text-blue-400 mb-4">
              FAQ
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-white">
              常見問題
            </h2>
          </div>
        </ScrollAnimationWrapper>

        {/* Desktop: 2 columns */}
        <div className="hidden md:grid md:grid-cols-2 gap-4">
          <div className="space-y-4">
            {leftColumn.map((faq, colIndex) => {
              const globalIndex = colIndex * 2;
              return (
                <ScrollAnimationWrapper key={globalIndex} delay={colIndex * 0.05}>
                  <FAQItem
                    faq={faq}
                    index={globalIndex}
                    isOpen={openIndex === globalIndex}
                    onToggle={() => handleToggle(globalIndex)}
                  />
                </ScrollAnimationWrapper>
              );
            })}
          </div>
          <div className="space-y-4">
            {rightColumn.map((faq, colIndex) => {
              const globalIndex = colIndex * 2 + 1;
              return (
                <ScrollAnimationWrapper key={globalIndex} delay={colIndex * 0.05 + 0.1}>
                  <FAQItem
                    faq={faq}
                    index={globalIndex}
                    isOpen={openIndex === globalIndex}
                    onToggle={() => handleToggle(globalIndex)}
                  />
                </ScrollAnimationWrapper>
              );
            })}
          </div>
        </div>

        {/* Mobile: 1 column */}
        <div className="md:hidden space-y-3">
          {faqs.map((faq, i) => (
            <ScrollAnimationWrapper key={i} delay={i * 0.05}>
              <FAQItem
                faq={faq}
                index={i}
                isOpen={openIndex === i}
                onToggle={() => handleToggle(i)}
              />
            </ScrollAnimationWrapper>
          ))}
        </div>
      </div>
    </section>
  );
}
