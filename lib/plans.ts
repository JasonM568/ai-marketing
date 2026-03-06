// ===== 訂閱方案定義 =====

export interface SubscriptionPlan {
  id: string;
  name: string;
  icon: string;
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
    price: 999,
    monthlyCredits: 30,
    maxBrands: 1,
    allPostsMonitoring: false,
    description: "適合個人品牌經營",
    features: [
      "每月 30 點數",
      "約可產出 20 篇短文",
      "管理 1 個品牌",
      "指定貼文留言監控",
      "點數可累積（最多 2 個月）",
    ],
  },
  pro: {
    id: "pro",
    name: "進階版",
    icon: "🚀",
    price: 1499,
    monthlyCredits: 80,
    maxBrands: 2,
    allPostsMonitoring: false,
    description: "適合小型企業多平台經營",
    features: [
      "每月 80 點數",
      "約可產出 60 篇短文",
      "管理 2 個品牌",
      "指定貼文留言監控",
      "點數可累積（最多 2 個月）",
    ],
  },
  business: {
    id: "business",
    name: "專業版",
    icon: "💎",
    price: 1999,
    monthlyCredits: 250,
    maxBrands: 5,
    allPostsMonitoring: true,
    description: "適合行銷公司 / 多品牌管理",
    features: [
      "每月 250 點數",
      "約可產出 180 篇短文",
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
  { type: "social_post", label: "社群貼文", credits: 1, description: "IG / FB / Threads / LINE" },
  { type: "reels_script", label: "短影音腳本", credits: 1, description: "Reels / 短影音" },
  { type: "ad_copy", label: "廣告文案", credits: 2, description: "Meta / Google 廣告" },
  { type: "edm", label: "EDM 電子報", credits: 3, description: "歡迎信 / 促銷信 / 再行銷" },
  { type: "blog_seo", label: "部落格 / SEO", credits: 4, description: "SEO 長文章" },
  { type: "strategy", label: "策略分析", credits: 5, description: "品牌策略 / 趨勢分析" },
  { type: "followup", label: "對話追問", credits: 1, description: "微調 / 追問 / 修改" },
  { type: "comment_reply", label: "留言回覆", credits: 1, description: "AI 自動回覆留言" },
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
    return { credits: 5, contentType: "strategy", tokenAllowance: 12000 };
  }

  // 內容產出組 — 根據 agent 類型
  switch (agentCode) {
    case "social-writer":
    case "content-repurposer":
    case "customer-responder":
      return { credits: 1, contentType: "social_post", tokenAllowance: 3000 };
    case "ad-copywriter":
      return { credits: 2, contentType: "ad_copy", tokenAllowance: 5000 };
    case "edm-writer":
      return { credits: 3, contentType: "edm", tokenAllowance: 8000 };
    case "seo-copywriter":
      return { credits: 4, contentType: "blog_seo", tokenAllowance: 10000 };
    case "sales-copywriter":
      return { credits: 2, contentType: "ad_copy", tokenAllowance: 5000 };
    default:
      return { credits: 1, contentType: "social_post", tokenAllowance: 3000 };
  }
}

// 追問判斷：如果 conversationId 已存在，代表是追問
export function getCreditsForFollowup(): { credits: number; contentType: string; tokenAllowance: number } {
  return { credits: 1, contentType: "followup", tokenAllowance: 3000 };
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
