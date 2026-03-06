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
  { value: 8, suffix: "+", label: "種 AI 助理" },
  { value: 3, suffix: "", label: "大社群平台" },
  { value: 6, suffix: "", label: "種內容類型" },
  { value: 24, suffix: "/7", label: "自動回覆" },
];

export default function StatsSection() {
  return (
    <section className="py-16 lg:py-24 px-4">
      <div className="max-w-5xl mx-auto">
        <ScrollAnimationWrapper>
          <div className="bg-gradient-to-r from-blue-900/20 via-gray-900 to-purple-900/20 border border-white/10 rounded-2xl p-8 lg:p-12">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-4">
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
}: {
  value: number;
  suffix: string;
  label: string;
}) {
  const { count, ref } = useCountUp(value, 1500);

  return (
    <div ref={ref} className="text-center">
      <div className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-2">
        {count}
        <span className="text-blue-400">{suffix}</span>
      </div>
      <p className="text-sm text-gray-400">{label}</p>
    </div>
  );
}
