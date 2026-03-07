// ===== 訂閱方案定義 =====

export interface SubscriptionPlan {
  id: string;
  name: string;
  icon: string;
  originalPrice: number;
  price: number;
  monthlyCredits: number;
  maxBrands: number;
  allPostsMonitoring: boolean;
  description: string;
  features: string[];
}

export const PLANS: Record<string, SubscriptionPlan> = {
  basic: {
    id: "basic",
    name: "基礎版",
    icon: "🌱",
    originalPrice: 1399,
    price: 999,
    monthlyCredits: 30,
    maxBrands: 1,
    allPostsMonitoring: false,
    description: "適合個人品牌經營",
    features: [
      "每月 30 點數",
      "每月可產出 10 篇貼文",
      "管理 1 個品牌",
      "指定貼文留言監控",
      "點數可累積（最多 2 個月）",
    ],
  },
  pro: {
    id: "pro",
    name: "進階版",
    icon: "🚀",
    originalPrice: 2299,
    price: 1499,
    monthlyCredits: 80,
    maxBrands: 2,
    allPostsMonitoring: false,
    description: "適合小型企業多平台經營",
    features: [
      "每月 80 點數",
      "每月可產出 25 篇貼文",
      "管理 2 個品牌",
      "指定貼文留言監控",
      "點數可累積（最多 2 個月）",
    ],
  },
  business: {
    id: "business",
    name: "專業版",
    icon: "💎",
    originalPrice: 4699,
    price: 3299,
    monthlyCredits: 180,
    maxBrands: 5,
    allPostsMonitoring: true,
    description: "適合行銷公司 / 多品牌管理",
    features: [
      "每月 180 點數",
      "每月可產出 35 篇貼文",
      "5 份深度分析報告",
      "管理 5 個品牌",
      "所有貼文留言監控",
      "點數可累積（最多 2 個月）",
    ],
  },
};

// ===== 內容類型扣點表 =====

export interface ContentCost {
  type: string;
  label: string;
  credits: number;
  description: string;
}

export const CONTENT_COSTS: ContentCost[] = [
  { type: "social_post", label: "社群貼文", credits: 3, description: "IG / FB / Threads / LINE" },
  { type: "reels_script", label: "短影音腳本", credits: 6, description: "Reels / 短影音" },
  { type: "ad_copy", label: "廣告文案", credits: 3, description: "Meta / Google 廣告" },
  { type: "edm", label: "EDM 電子報", credits: 6, description: "歡迎信 / 促銷信 / 再行銷" },
  { type: "blog_seo", label: "部落格 / SEO 文案", credits: 9, description: "SEO 長文章" },
  { type: "strategy", label: "策略分析", credits: 12, description: "品牌策略分析" },
  { type: "conversation", label: "開啟對話", credits: 2, description: "2 點起" },
  { type: "ad_analysis", label: "廣告分析", credits: 12, description: "廣告成效分析" },
  { type: "ga_analysis", label: "GA 分析", credits: 12, description: "Google Analytics 分析" },
  { type: "trend_analysis", label: "趨勢分析", credits: 12, description: "市場趨勢分析" },
];

// 是否可使用「所有貼文」監控模式
export function canUseAllPostsMonitoring(planId: string): boolean {
  const plan = PLANS[planId];
  return plan?.allPostsMonitoring || false;
}

// 根據 agent category + code 判斷扣多少點
export function getCreditsForAgent(agentCode: string, category: string): { credits: number; contentType: string; tokenAllowance: number } {
  // 策略分析組
  if (category === "strategy") {
    return { credits: 12, contentType: "strategy", tokenAllowance: 18000 };
  }

  // 內容產出組 — 根據 agent 類型
  switch (agentCode) {
    case "social-writer":
    case "content-repurposer":
    case "customer-responder":
      return { credits: 3, contentType: "social_post", tokenAllowance: 5000 };
    case "ad-copywriter":
      return { credits: 3, contentType: "ad_copy", tokenAllowance: 5000 };
    case "edm-writer":
      return { credits: 6, contentType: "edm", tokenAllowance: 10000 };
    case "seo-copywriter":
      return { credits: 9, contentType: "blog_seo", tokenAllowance: 15000 };
    case "sales-copywriter":
      return { credits: 3, contentType: "ad_copy", tokenAllowance: 5000 };
    default:
      return { credits: 3, contentType: "social_post", tokenAllowance: 5000 };
  }
}

// 追問判斷：如果 conversationId 已存在，代表是追問（開啟對話 2 點起）
export function getCreditsForFollowup(): { credits: number; contentType: string; tokenAllowance: number } {
  return { credits: 2, contentType: "conversation", tokenAllowance: 4000 };
}

// 計算超量扣點：每超過 1,000 tokens 扣 1 點
export function calculateOverageCost(totalTokens: number, tokenAllowance: number): number {
  if (totalTokens <= tokenAllowance) return 0;
  const overage = totalTokens - tokenAllowance;
  return Math.ceil(overage / 1000);
}

// 點數累積上限：最多存 2 個月的 quota
export function getMaxCarryOver(monthlyQuota: number): number {
  return monthlyQuota * 2;
}
