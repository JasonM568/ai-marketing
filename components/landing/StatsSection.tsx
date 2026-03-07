"use client";

import { useEffect, useState, useRef } from "react";
import { useInView } from "framer-motion";
import ScrollAnimationWrapper from "./ScrollAnimationWrapper";

function useCountUp(target: number, duration: number = 2000) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (!isInView || hasAnimated.current) return;
    hasAnimated.current = true;

    const start = performance.now();
    function step(now: number) {
      const progress = Math.min((now - start) / duration, 1);
      // easeOutCubic for smoother deceleration
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(target * eased));
      if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }, [isInView, target, duration]);

  return { count, ref };
}

const stats = [
  {
    value: 8,
    suffix: "+",
    label: "種 AI 助理",
    desc: "社群貼文到 SEO 全覆蓋",
  },
  {
    value: 3,
    suffix: "",
    label: "大社群平台",
    desc: "Facebook・Instagram・Threads",
  },
  {
    value: 6,
    suffix: "+",
    label: "種內容類型",
    desc: "貼文・廣告・EDM・部落格",
  },
  {
    value: 24,
    suffix: "/7",
    label: "自動回覆",
    desc: "AI 全天候智慧回覆留言",
  },
];

export default function StatsSection() {
  return (
    <section className="py-16 lg:py-24 px-4">
      <div className="max-w-5xl mx-auto">
        <ScrollAnimationWrapper>
          <div className="relative overflow-hidden bg-gradient-to-r from-blue-900/20 via-gray-900/50 to-purple-900/20 border border-white/10 rounded-2xl p-8 lg:p-12">
            {/* Subtle background glow */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-purple-500/5 pointer-events-none" />

            <div className="relative grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-4">
              {stats.map((stat, i) => (
                <StatItem key={i} {...stat} />
              ))}
            </div>
          </div>
        </ScrollAnimationWrapper>
      </div>
    </section>
  );
}

function StatItem({
  value,
  suffix,
  label,
  desc,
}: {
  value: number;
  suffix: string;
  label: string;
  desc: string;
}) {
  const { count, ref } = useCountUp(value, 1500);

  return (
    <div ref={ref} className="text-center">
      <div className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-1">
        {count}
        <span className="text-blue-400">{suffix}</span>
      </div>
      <p className="text-sm font-medium text-gray-300 mb-1">{label}</p>
      <p className="text-xs text-gray-500">{desc}</p>
    </div>
  );
}
