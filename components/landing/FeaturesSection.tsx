"use client";

import ScrollAnimationWrapper from "./ScrollAnimationWrapper";

/* ------------------------------------------------------------------ */
/*  Mockup Components                                                  */
/* ------------------------------------------------------------------ */

function AiWorkspaceMockup() {
  return (
    <div className="bg-gray-900/50 border border-white/10 rounded-2xl p-5 space-y-4">
      {/* Header bar */}
      <div className="flex items-center gap-2 pb-3 border-b border-white/5">
        <div className="w-3 h-3 rounded-full bg-red-500/60" />
        <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
        <div className="w-3 h-3 rounded-full bg-green-500/60" />
        <span className="ml-2 text-xs text-gray-500">AI 內容工作區</span>
      </div>

      {/* Chat area */}
      <div className="space-y-3">
        {/* User command */}
        <div className="flex justify-end">
          <div className="bg-blue-600/20 border border-blue-500/20 rounded-xl px-4 py-2.5 max-w-[75%]">
            <code className="text-blue-300 text-xs font-mono">/ig-post</code>
            <p className="text-gray-300 text-xs mt-1">新品上市宣傳文案，活潑風格</p>
          </div>
        </div>

        {/* AI response */}
        <div className="flex justify-start">
          <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 max-w-[80%]">
            <div className="flex items-center gap-1.5 mb-1.5">
              <div className="w-4 h-4 rounded-full bg-purple-500/30 flex items-center justify-center">
                <span className="text-[8px] text-purple-300">AI</span>
              </div>
              <span className="text-[10px] text-gray-500">Claude AI</span>
            </div>
            <p className="text-gray-300 text-xs leading-relaxed">
              &#x1F389; 新品搶先看！你們敲碗很久的
              <span className="text-blue-400">#新系列</span> 終於來啦！&#x2728;
              <br />
              限時早鳥優惠倒數中...
            </p>
          </div>
        </div>
      </div>

      {/* Input bar */}
      <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3 py-2">
        <span className="text-gray-600 text-xs">/</span>
        <span className="text-gray-500 text-xs flex-1">輸入指令或直接描述需求...</span>
        <div className="w-6 h-6 rounded bg-blue-600/30 flex items-center justify-center">
          <svg className="w-3 h-3 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
          </svg>
        </div>
      </div>
    </div>
  );
}

function ScheduleMockup() {
  const days = ["一", "二", "三", "四", "五", "六", "日"];
  return (
    <div className="bg-gray-900/50 border border-white/10 rounded-2xl p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-white/5">
        <span className="text-xs text-gray-400 font-medium">三月 2026</span>
        <div className="flex items-center gap-1">
          <div className="w-5 h-5 rounded bg-white/5 flex items-center justify-center">
            <span className="text-[10px] text-gray-500">&lt;</span>
          </div>
          <div className="w-5 h-5 rounded bg-white/5 flex items-center justify-center">
            <span className="text-[10px] text-gray-500">&gt;</span>
          </div>
        </div>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 gap-1 text-center">
        {days.map((d) => (
          <span key={d} className="text-[10px] text-gray-600 py-1">
            {d}
          </span>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: 28 }, (_, i) => {
          const day = i + 1;
          const hasEvent =
            day === 3 || day === 7 || day === 10 || day === 14 || day === 18 || day === 22 || day === 25;
          const eventColor =
            day === 3 || day === 14
              ? "bg-blue-500/30 border-blue-500/20"
              : day === 7 || day === 18
                ? "bg-purple-500/30 border-purple-500/20"
                : day === 10 || day === 25
                  ? "bg-pink-500/30 border-pink-500/20"
                  : "bg-green-500/30 border-green-500/20";

          return (
            <div
              key={i}
              className={`aspect-square rounded-md flex flex-col items-center justify-center text-[10px] ${
                hasEvent
                  ? `${eventColor} border text-white`
                  : "text-gray-600 hover:bg-white/5"
              }`}
            >
              <span>{day}</span>
              {hasEvent && (
                <div className="w-1 h-1 rounded-full bg-current mt-0.5 opacity-60" />
              )}
            </div>
          );
        })}
      </div>

      {/* Upcoming posts */}
      <div className="space-y-2 pt-2 border-t border-white/5">
        <div className="flex items-center gap-2 bg-blue-500/10 border border-blue-500/10 rounded-lg px-3 py-2">
          <div className="w-1.5 h-6 rounded-full bg-blue-500/60" />
          <div className="flex-1 min-w-0">
            <p className="text-[10px] text-gray-300 truncate">新品發布 - IG 貼文</p>
            <p className="text-[9px] text-gray-600">3/10 14:00</p>
          </div>
          <span className="text-[9px] text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded">排程中</span>
        </div>
        <div className="flex items-center gap-2 bg-purple-500/10 border border-purple-500/10 rounded-lg px-3 py-2">
          <div className="w-1.5 h-6 rounded-full bg-purple-500/60" />
          <div className="flex-1 min-w-0">
            <p className="text-[10px] text-gray-300 truncate">品牌故事 - FB + Threads</p>
            <p className="text-[9px] text-gray-600">3/14 10:00</p>
          </div>
          <span className="text-[9px] text-purple-400 bg-purple-500/10 px-1.5 py-0.5 rounded">排程中</span>
        </div>
      </div>
    </div>
  );
}

function CommentsMockup() {
  const comments = [
    {
      user: "小花",
      avatar: "bg-pink-500/30",
      text: "請問這個有貨嗎？想買給朋友！",
      reply: "有的！目前全色系都有現貨，歡迎直接下單唷 🛒",
      platform: "IG",
    },
    {
      user: "阿明",
      avatar: "bg-blue-500/30",
      text: "運費怎麼算？",
      reply: "滿 $500 免運費，一般訂單運費 $60 元！",
      platform: "FB",
    },
    {
      user: "Yuki",
      avatar: "bg-green-500/30",
      text: "好好看！顏色好多怎麼選 😭",
      reply: null,
      platform: "Threads",
    },
  ];

  return (
    <div className="bg-gray-900/50 border border-white/10 rounded-2xl p-5 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-white/5">
        <span className="text-xs text-gray-400 font-medium">留言管理</span>
        <div className="flex items-center gap-1.5">
          <span className="text-[9px] text-yellow-400 bg-yellow-500/10 px-2 py-0.5 rounded-full">
            1 待處理
          </span>
          <span className="text-[9px] text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full">
            2 已回覆
          </span>
        </div>
      </div>

      {/* Comment list */}
      {comments.map((c, i) => (
        <div key={i} className="bg-white/[0.02] border border-white/5 rounded-xl p-3 space-y-2">
          {/* Comment header */}
          <div className="flex items-center gap-2">
            <div
              className={`w-6 h-6 rounded-full ${c.avatar} flex items-center justify-center`}
            >
              <span className="text-[9px] text-white/80">{c.user[0]}</span>
            </div>
            <span className="text-xs text-gray-300 font-medium">{c.user}</span>
            <span className="text-[9px] text-gray-600 bg-white/5 px-1.5 py-0.5 rounded">
              {c.platform}
            </span>
          </div>

          {/* Comment body */}
          <p className="text-xs text-gray-400 leading-relaxed pl-8">{c.text}</p>

          {/* AI reply or action buttons */}
          {c.reply ? (
            <div className="ml-8 bg-green-500/5 border border-green-500/10 rounded-lg px-3 py-2">
              <div className="flex items-center gap-1 mb-1">
                <span className="text-[9px] text-green-400">AI 建議回覆</span>
              </div>
              <p className="text-xs text-gray-300 leading-relaxed">{c.reply}</p>
              <div className="flex items-center gap-1.5 mt-2">
                <button className="text-[9px] bg-green-600/20 text-green-400 border border-green-500/20 px-2.5 py-1 rounded-md">
                  核准發送
                </button>
                <button className="text-[9px] bg-white/5 text-gray-400 border border-white/10 px-2.5 py-1 rounded-md">
                  編輯
                </button>
                <button className="text-[9px] bg-white/5 text-gray-500 border border-white/10 px-2.5 py-1 rounded-md">
                  忽略
                </button>
              </div>
            </div>
          ) : (
            <div className="ml-8 flex items-center gap-2">
              <div className="flex items-center gap-1 text-[9px] text-yellow-400">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
                AI 生成回覆中...
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function BrandManagementMockup() {
  const brands = [
    { name: "日光咖啡", initials: "日", color: "bg-orange-500/30 border-orange-500/20", status: "運作中", platforms: 3 },
    { name: "花語生活", initials: "花", color: "bg-pink-500/30 border-pink-500/20", status: "運作中", platforms: 2 },
    { name: "山海旅遊", initials: "山", color: "bg-cyan-500/30 border-cyan-500/20", status: "設定中", platforms: 1 },
  ];

  return (
    <div className="bg-gray-900/50 border border-white/10 rounded-2xl p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-white/5">
        <span className="text-xs text-gray-400 font-medium">品牌管理</span>
        <div className="flex items-center gap-1 text-[9px] text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded-full">
          <span>3 / 5 品牌</span>
        </div>
      </div>

      {/* Brand cards grid */}
      <div className="grid grid-cols-1 gap-2.5">
        {brands.map((b, i) => (
          <div
            key={i}
            className="flex items-center gap-3 bg-white/[0.02] border border-white/5 rounded-xl px-4 py-3"
          >
            {/* Brand icon */}
            <div
              className={`w-9 h-9 rounded-lg ${b.color} border flex items-center justify-center flex-shrink-0`}
            >
              <span className="text-sm text-white/80">{b.initials}</span>
            </div>

            {/* Brand info */}
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-200 font-medium">{b.name}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[9px] text-gray-600">{b.platforms} 個平台已連結</span>
              </div>
            </div>

            {/* Status */}
            <span
              className={`text-[9px] px-2 py-0.5 rounded-full ${
                b.status === "運作中"
                  ? "text-green-400 bg-green-500/10"
                  : "text-yellow-400 bg-yellow-500/10"
              }`}
            >
              {b.status}
            </span>
          </div>
        ))}
      </div>

      {/* Add brand button */}
      <button className="w-full border border-dashed border-white/10 rounded-xl py-2.5 text-xs text-gray-600 hover:text-gray-400 hover:border-white/20 transition-colors flex items-center justify-center gap-1.5">
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
        新增品牌
      </button>

      {/* Team bar */}
      <div className="flex items-center justify-between bg-white/[0.02] border border-white/5 rounded-lg px-3 py-2">
        <span className="text-[10px] text-gray-500">團隊成員</span>
        <div className="flex items-center -space-x-1.5">
          <div className="w-5 h-5 rounded-full bg-blue-500/30 border border-gray-900 flex items-center justify-center">
            <span className="text-[7px] text-white/70">J</span>
          </div>
          <div className="w-5 h-5 rounded-full bg-pink-500/30 border border-gray-900 flex items-center justify-center">
            <span className="text-[7px] text-white/70">A</span>
          </div>
          <div className="w-5 h-5 rounded-full bg-green-500/30 border border-gray-900 flex items-center justify-center">
            <span className="text-[7px] text-white/70">K</span>
          </div>
          <div className="w-5 h-5 rounded-full bg-white/10 border border-gray-900 flex items-center justify-center">
            <span className="text-[7px] text-white/50">+2</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Feature data                                                       */
/* ------------------------------------------------------------------ */

interface Feature {
  badge: string;
  badgeColor: string;
  title: string;
  description: string;
  bullets: string[];
  accentColor: string;
  Mockup: React.FC;
}

const features: Feature[] = [
  {
    badge: "AI 驅動",
    badgeColor: "text-blue-400 bg-blue-500/10 border-blue-500/20",
    title: "AI 內容工作區",
    description:
      "8 種 AI 助理，從社群貼文到 SEO 文章，一個指令即可生成符合品牌調性的專業內容。",
    bullets: [
      "支援 IG、FB、Threads、LINE 等平台",
      "品牌語調自動匹配",
      "內容可編輯、儲存、重新產出",
    ],
    accentColor: "text-blue-400",
    Mockup: AiWorkspaceMockup,
  },
  {
    badge: "自動化",
    badgeColor: "text-purple-400 bg-purple-500/10 border-purple-500/20",
    title: "多平台排程發文",
    description:
      "支援 Facebook、Instagram、Threads 三大平台排程。設定時間，系統自動發布，不再手動貼文。",
    bullets: [
      "日曆視圖管理所有排程",
      "支援圖片附件上傳",
      "即時發布或定時排程",
    ],
    accentColor: "text-purple-400",
    Mockup: ScheduleMockup,
  },
  {
    badge: "24/7 運作",
    badgeColor: "text-green-400 bg-green-500/10 border-green-500/20",
    title: "AI 智慧回覆留言",
    description:
      "自動監控留言，AI 根據品牌調性即時生成回覆建議。核准、編輯或一鍵發送。",
    bullets: [
      "支援三大平台留言監控",
      "AI 建議回覆可審核修改",
      "瀏覽器推播即時通知",
    ],
    accentColor: "text-green-400",
    Mockup: CommentsMockup,
  },
  {
    badge: "多品牌",
    badgeColor: "text-orange-400 bg-orange-500/10 border-orange-500/20",
    title: "品牌管理中心",
    description:
      "集中管理多個品牌，設定品牌調性、連結社群帳號、指派團隊成員。",
    bullets: [
      "最多可管理 5 個品牌",
      "團隊成員角色權限控制",
      "品牌風格與調性設定",
    ],
    accentColor: "text-orange-400",
    Mockup: BrandManagementMockup,
  },
];

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */

export default function FeaturesSection() {
  return (
    <section id="features" className="py-20 lg:py-32 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Section header */}
        <ScrollAnimationWrapper>
          <div className="text-center mb-20">
            <span className="inline-block px-4 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-full text-sm text-blue-400 mb-4">
              核心功能
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-white">
              強大功能，一站搞定
            </h2>
          </div>
        </ScrollAnimationWrapper>

        {/* Feature blocks */}
        <div className="space-y-24 lg:space-y-32">
          {features.map((feature, i) => {
            const isEven = i % 2 === 1;
            const { Mockup } = feature;

            const textBlock = (
              <div className="space-y-5">
                <span
                  className={`inline-block px-3 py-1 text-xs font-medium border rounded-full ${feature.badgeColor}`}
                >
                  {feature.badge}
                </span>
                <h3 className="text-2xl sm:text-3xl font-bold text-white">
                  {feature.title}
                </h3>
                <p className="text-gray-400 leading-relaxed">
                  {feature.description}
                </p>
                <ul className="space-y-3">
                  {feature.bullets.map((bullet, j) => (
                    <li key={j} className="flex items-start gap-2.5">
                      <svg
                        className={`w-5 h-5 mt-0.5 flex-shrink-0 ${feature.accentColor}`}
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
                      <span className="text-gray-300 text-sm">{bullet}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );

            const mockupBlock = (
              <div>
                <Mockup />
              </div>
            );

            return (
              <div
                key={i}
                className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center"
              >
                {isEven ? (
                  <>
                    <ScrollAnimationWrapper delay={0.1}>
                      {mockupBlock}
                    </ScrollAnimationWrapper>
                    <ScrollAnimationWrapper delay={0.25}>
                      {textBlock}
                    </ScrollAnimationWrapper>
                  </>
                ) : (
                  <>
                    <ScrollAnimationWrapper delay={0.1}>
                      {textBlock}
                    </ScrollAnimationWrapper>
                    <ScrollAnimationWrapper delay={0.25}>
                      {mockupBlock}
                    </ScrollAnimationWrapper>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
