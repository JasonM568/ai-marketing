"use client";

import { useState, useMemo } from "react";

interface ScheduledPost {
  id: string;
  brandId: string;
  platform: string;
  content: string;
  imageUrl: string | null;
  scheduledAt: string;
  status: string;
  publishedPostId: string | null;
  publishError: string | null;
  createdAt: string;
}

interface ScheduleCalendarProps {
  posts: ScheduledPost[];
  onDaySelect: (date: Date) => void;
  selectedDate: Date | null;
}

const WEEKDAYS = ["一", "二", "三", "四", "五", "六", "日"];

const platformColors: Record<string, { bg: string; border: string; dot: string }> = {
  facebook: { bg: "bg-blue-500/30", border: "border-blue-500/20", dot: "bg-blue-400" },
  fb: { bg: "bg-blue-500/30", border: "border-blue-500/20", dot: "bg-blue-400" },
  instagram: { bg: "bg-pink-500/30", border: "border-pink-500/20", dot: "bg-pink-400" },
  ig: { bg: "bg-pink-500/30", border: "border-pink-500/20", dot: "bg-pink-400" },
  threads: { bg: "bg-purple-500/30", border: "border-purple-500/20", dot: "bg-purple-400" },
};

const defaultPlatformColor = { bg: "bg-green-500/30", border: "border-green-500/20", dot: "bg-green-400" };

function toLocalDateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
}

function generateCalendarDays(year: number, month: number): CalendarDay[] {
  const firstDay = new Date(year, month, 1);
  // getDay(): 0=Sun → Convert to Mon=0, Sun=6
  const startDow = (firstDay.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const days: CalendarDay[] = [];

  // Previous month padding
  for (let i = startDow - 1; i >= 0; i--) {
    days.push({ date: new Date(year, month, -i), isCurrentMonth: false });
  }

  // Current month
  for (let i = 1; i <= daysInMonth; i++) {
    days.push({ date: new Date(year, month, i), isCurrentMonth: true });
  }

  // Next month padding (fill to 35 or 42)
  const totalNeeded = days.length <= 35 ? 35 : 42;
  let nextDay = 1;
  while (days.length < totalNeeded) {
    days.push({ date: new Date(year, month + 1, nextDay++), isCurrentMonth: false });
  }

  return days;
}

export default function ScheduleCalendar({ posts, onDaySelect, selectedDate }: ScheduleCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });

  const today = new Date();

  const calendarDays = useMemo(
    () => generateCalendarDays(currentMonth.year, currentMonth.month),
    [currentMonth.year, currentMonth.month]
  );

  // Group posts by local date key
  const postsByDate = useMemo(() => {
    const map = new Map<string, ScheduledPost[]>();
    posts.forEach((post) => {
      const key = toLocalDateKey(new Date(post.scheduledAt));
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(post);
    });
    return map;
  }, [posts]);

  function goToPrevMonth() {
    setCurrentMonth((prev) => {
      const m = prev.month - 1;
      return m < 0 ? { year: prev.year - 1, month: 11 } : { year: prev.year, month: m };
    });
  }

  function goToNextMonth() {
    setCurrentMonth((prev) => {
      const m = prev.month + 1;
      return m > 11 ? { year: prev.year + 1, month: 0 } : { year: prev.year, month: m };
    });
  }

  function goToToday() {
    const now = new Date();
    setCurrentMonth({ year: now.getFullYear(), month: now.getMonth() });
  }

  // Get unique platforms for a day
  function getDayPlatforms(dateKey: string): string[] {
    const dayPosts = postsByDate.get(dateKey) || [];
    return [...new Set(dayPosts.map((p) => p.platform.toLowerCase()))];
  }

  // Get dominant platform color for day background
  function getDayColor(platforms: string[]): { bg: string; border: string } | null {
    if (platforms.length === 0) return null;
    const first = platforms[0];
    const color = platformColors[first] || defaultPlatformColor;
    return { bg: color.bg, border: color.border };
  }

  const monthLabel = `${currentMonth.year} 年 ${currentMonth.month + 1} 月`;

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 sm:p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-800">
        <h3 className="text-sm sm:text-base font-medium text-gray-300">{monthLabel}</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={goToToday}
            className="px-2.5 py-1 text-xs text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
          >
            今天
          </button>
          <div className="flex items-center gap-1">
            <button
              onClick={goToPrevMonth}
              className="w-7 h-7 rounded-lg bg-gray-800 hover:bg-gray-700 flex items-center justify-center transition-colors"
            >
              <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={goToNextMonth}
              className="w-7 h-7 rounded-lg bg-gray-800 hover:bg-gray-700 flex items-center justify-center transition-colors"
            >
              <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {WEEKDAYS.map((d) => (
          <div key={d} className="text-center text-xs text-gray-600 py-1.5 font-medium">
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((day, idx) => {
          const dateKey = toLocalDateKey(day.date);
          const dayPosts = postsByDate.get(dateKey) || [];
          const platforms = getDayPlatforms(dateKey);
          const dayColor = getDayColor(platforms);
          const isToday = isSameDay(day.date, today);
          const isSelected = selectedDate ? isSameDay(day.date, selectedDate) : false;
          const postCount = dayPosts.length;

          return (
            <button
              key={idx}
              onClick={() => onDaySelect(day.date)}
              className={`
                relative aspect-square rounded-lg flex flex-col items-center justify-center gap-0.5
                text-xs sm:text-sm transition-all cursor-pointer
                ${!day.isCurrentMonth ? "opacity-30" : ""}
                ${isSelected ? "ring-2 ring-blue-400 ring-offset-1 ring-offset-gray-900" : ""}
                ${isToday && !isSelected ? "ring-1 ring-blue-500/50" : ""}
                ${
                  dayColor
                    ? `${dayColor.bg} border ${dayColor.border} text-white hover:brightness-125`
                    : "text-gray-500 hover:bg-white/5"
                }
              `}
            >
              <span className={`font-medium ${dayColor ? "text-white" : ""}`}>
                {day.date.getDate()}
              </span>

              {/* Platform dots */}
              {platforms.length > 0 && (
                <div className="flex items-center gap-0.5">
                  {platforms.slice(0, 3).map((p) => {
                    const color = platformColors[p] || defaultPlatformColor;
                    return (
                      <div
                        key={p}
                        className={`w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full ${color.dot}`}
                      />
                    );
                  })}
                </div>
              )}

              {/* Post count badge for days with many posts */}
              {postCount > 3 && (
                <span className="absolute top-0.5 right-0.5 w-3.5 h-3.5 sm:w-4 sm:h-4 bg-blue-600 rounded-full text-[8px] sm:text-[9px] text-white flex items-center justify-center font-bold">
                  {postCount}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Platform legend */}
      <div className="flex items-center gap-4 mt-4 pt-3 border-t border-gray-800">
        {[
          { label: "Facebook", color: "bg-blue-400" },
          { label: "Instagram", color: "bg-pink-400" },
          { label: "Threads", color: "bg-purple-400" },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-1.5">
            <div className={`w-2 h-2 rounded-full ${item.color}`} />
            <span className="text-xs text-gray-500">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
