import { pgTable, uuid, varchar, text, boolean, integer, timestamp, jsonb, uniqueIndex } from "drizzle-orm/pg-core";

// ===== 既有表 =====

export const adminUsers = pgTable("admin_users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: varchar("email", { length: 255 }).unique().notNull(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  name: varchar("name", { length: 100 }),
  role: varchar("role", { length: 20 }).default("admin").notNull(),
  planId: varchar("plan_id", { length: 20 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const brands = pgTable("brands", {
  id: uuid("id").defaultRandom().primaryKey(),
  brandCode: varchar("brand_code", { length: 30 }).unique().notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  industry: varchar("industry", { length: 50 }),
  status: varchar("status", { length: 20 }).default("active").notNull(),
  createdBy: uuid("created_by"),
  brandVoice: text("brand_voice"),
  icp: text("icp"),
  services: text("services"),
  contentPillars: text("content_pillars"),
  pastHits: text("past_hits"),
  brandStory: text("brand_story"),
  adConfig: jsonb("ad_config"),
  crmConfig: jsonb("crm_config"),
  platforms: jsonb("platforms").default(["ig", "fb", "threads", "line", "reels", "ads", "blog"]),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ===== 品牌成員（多對多：品牌 ↔ 使用者）=====

export const brandMembers = pgTable("brand_members", {
  id: uuid("id").defaultRandom().primaryKey(),
  brandId: uuid("brand_id").notNull(),
  userId: uuid("user_id").notNull(),
  role: varchar("role", { length: 20 }).default("member").notNull(), // "manager" | "member"
  assignedBy: uuid("assigned_by"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  brandUserUnique: uniqueIndex("brand_members_brand_user_unique").on(table.brandId, table.userId),
}));

export const agents = pgTable("agents", {
  id: uuid("id").defaultRandom().primaryKey(),
  agentCode: varchar("agent_code", { length: 50 }).unique().notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  role: varchar("role", { length: 100 }).notNull(),
  category: varchar("category", { length: 20 }).notNull(),
  icon: varchar("icon", { length: 10 }),
  description: text("description"),
  systemPrompt: text("system_prompt").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  capabilities: jsonb("capabilities").default([]),
  outputFormats: jsonb("output_formats").default([]),
  sortOrder: integer("sort_order").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const conversations = pgTable("conversations", {
  id: uuid("id").defaultRandom().primaryKey(),
  brandId: uuid("brand_id"),
  agentId: uuid("agent_id"),
  createdBy: uuid("created_by"),
  title: varchar("title", { length: 200 }),
  messages: jsonb("messages").default([]),
  status: varchar("status", { length: 20 }).default("active"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const drafts = pgTable("drafts", {
  id: uuid("id").defaultRandom().primaryKey(),
  conversationId: uuid("conversation_id"),
  brandId: uuid("brand_id"),
  agentId: uuid("agent_id"),
  createdBy: uuid("created_by"),
  platform: varchar("platform", { length: 20 }),
  topic: varchar("topic", { length: 200 }),
  content: text("content").notNull(),
  metadata: jsonb("metadata"),
  status: varchar("status", { length: 20 }).default("draft").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ===== 品牌參考資料 =====

export const brandFiles = pgTable("brand_files", {
  id: uuid("id").defaultRandom().primaryKey(),
  brandId: uuid("brand_id").notNull(),
  fileName: varchar("file_name", { length: 255 }).notNull(),
  fileType: varchar("file_type", { length: 50 }).notNull(),
  fileSize: integer("file_size").notNull(),
  storagePath: varchar("storage_path", { length: 500 }).notNull(),
  extractedText: text("extracted_text"),
  uploadedBy: uuid("uploaded_by"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ===== 訂閱點數系統 =====

// 用戶點數餘額（每個用戶一筆記錄）
export const userCredits = pgTable("user_credits", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().unique(),
  balance: integer("balance").default(0).notNull(),
  monthlyQuota: integer("monthly_quota").default(0).notNull(),
  carryOver: integer("carry_over").default(0).notNull(),
  maxBrands: integer("max_brands").default(1).notNull(),
  currentPeriodStart: timestamp("current_period_start"),
  currentPeriodEnd: timestamp("current_period_end"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// 點數使用記錄
export const creditUsage = pgTable("credit_usage", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull(),
  agentId: uuid("agent_id"),
  brandId: uuid("brand_id"),
  conversationId: uuid("conversation_id"),
  creditsUsed: integer("credits_used").notNull(),
  contentType: varchar("content_type", { length: 30 }).notNull(),
  inputTokens: integer("input_tokens").default(0),
  outputTokens: integer("output_tokens").default(0),
  description: varchar("description", { length: 200 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 點數異動記錄（發放、扣除、過期、手動調整）
export const creditTransactions = pgTable("credit_transactions", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull(),
  type: varchar("type", { length: 20 }).notNull(),
  amount: integer("amount").notNull(),
  balanceAfter: integer("balance_after").notNull(),
  description: varchar("description", { length: 200 }),
  createdBy: uuid("created_by"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ===== 社群帳號 + 排程發文 =====

export const socialAccounts = pgTable("social_accounts", {
  id: uuid("id").defaultRandom().primaryKey(),
  brandId: uuid("brand_id").notNull(),
  platform: varchar("platform", { length: 20 }).notNull(),
  platformUserId: varchar("platform_user_id", { length: 100 }),
  platformUsername: varchar("platform_username", { length: 100 }),
  pageId: varchar("page_id", { length: 100 }),
  accessToken: text("access_token").notNull(),
  tokenExpiresAt: timestamp("token_expires_at"),
  scopes: text("scopes"),
  metaUserId: varchar("meta_user_id", { length: 100 }),
  connectedBy: uuid("connected_by"),
  status: varchar("status", { length: 20 }).default("active").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  brandPlatformUnique: uniqueIndex("social_accounts_brand_id_platform_key").on(table.brandId, table.platform),
}));

export const scheduledPosts = pgTable("scheduled_posts", {
  id: uuid("id").defaultRandom().primaryKey(),
  draftId: uuid("draft_id"),
  brandId: uuid("brand_id").notNull(),
  socialAccountId: uuid("social_account_id").notNull(),
  platform: varchar("platform", { length: 20 }).notNull(),
  content: text("content").notNull(),
  imageUrl: text("image_url"),
  scheduledAt: timestamp("scheduled_at").notNull(),
  status: varchar("status", { length: 20 }).default("pending").notNull(),
  publishedPostId: varchar("published_post_id", { length: 200 }),
  publishError: text("publish_error"),
  retryCount: integer("retry_count").default(0),
  createdBy: uuid("created_by").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ===== 訂閱金流 =====

export const subscriptions = pgTable("subscriptions", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull(),
  planId: varchar("plan_id", { length: 20 }).notNull(),
  status: varchar("status", { length: 20 }).default("pending").notNull(),
  ecpayMerchantTradeNo: varchar("ecpay_merchant_trade_no", { length: 50 }),
  ecpayPeriodType: varchar("ecpay_period_type", { length: 10 }),
  ecpayFrequency: integer("ecpay_frequency").default(1),
  ecpayExecTimes: integer("ecpay_exec_times").default(99),
  ecpayCardLast4: varchar("ecpay_card_last4", { length: 4 }),
  currentPeriodStart: timestamp("current_period_start"),
  currentPeriodEnd: timestamp("current_period_end"),
  cancelAtPeriodEnd: boolean("cancel_at_period_end").default(false),
  cancelledAt: timestamp("cancelled_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const paymentRecords = pgTable("payment_records", {
  id: uuid("id").defaultRandom().primaryKey(),
  subscriptionId: uuid("subscription_id"),
  userId: uuid("user_id").notNull(),
  ecpayMerchantTradeNo: varchar("ecpay_merchant_trade_no", { length: 50 }),
  ecpayTradeNo: varchar("ecpay_trade_no", { length: 50 }),
  planId: varchar("plan_id", { length: 20 }).notNull(),
  amount: integer("amount").notNull(),
  status: varchar("status", { length: 20 }).default("pending").notNull(),
  paymentType: varchar("payment_type", { length: 20 }),
  ecpayRtnCode: varchar("ecpay_rtn_code", { length: 10 }),
  ecpayRtnMsg: varchar("ecpay_rtn_msg", { length: 200 }),
  ecpayPaymentDate: timestamp("ecpay_payment_date"),
  rawCallback: jsonb("raw_callback"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ===== 留言監控 + AI 回覆 =====

export const commentMonitors = pgTable("comment_monitors", {
  id: uuid("id").defaultRandom().primaryKey(),
  brandId: uuid("brand_id").notNull(),
  socialAccountId: uuid("social_account_id").notNull(),
  platform: varchar("platform", { length: 20 }).notNull(),
  monitorMode: varchar("monitor_mode", { length: 20 }).default("specific").notNull(),
  publishedPostId: varchar("published_post_id", { length: 200 }),
  postContentPreview: text("post_content_preview"),
  status: varchar("status", { length: 20 }).default("active").notNull(),
  createdBy: uuid("created_by").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const incomingComments = pgTable("incoming_comments", {
  id: uuid("id").defaultRandom().primaryKey(),
  monitorId: uuid("monitor_id"),
  brandId: uuid("brand_id").notNull(),
  platform: varchar("platform", { length: 20 }).notNull(),
  platformCommentId: varchar("platform_comment_id", { length: 200 }).unique().notNull(),
  platformPostId: varchar("platform_post_id", { length: 200 }).notNull(),
  parentCommentId: varchar("parent_comment_id", { length: 200 }),
  commenterName: varchar("commenter_name", { length: 200 }),
  commenterId: varchar("commenter_id", { length: 200 }),
  commentText: text("comment_text").notNull(),
  commentTimestamp: timestamp("comment_timestamp"),
  status: varchar("status", { length: 20 }).default("new").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const replySuggestions = pgTable("reply_suggestions", {
  id: uuid("id").defaultRandom().primaryKey(),
  commentId: uuid("comment_id").notNull(),
  brandId: uuid("brand_id").notNull(),
  suggestedText: text("suggested_text").notNull(),
  aiModel: varchar("ai_model", { length: 50 }).default("claude-sonnet-4-20250514"),
  status: varchar("status", { length: 20 }).default("pending").notNull(),
  editedText: text("edited_text"),
  postedReplyId: varchar("posted_reply_id", { length: 200 }),
  postedAt: timestamp("posted_at"),
  reviewedBy: uuid("reviewed_by"),
  reviewedAt: timestamp("reviewed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Type exports
export type Brand = typeof brands.$inferSelect;
export type Agent = typeof agents.$inferSelect;
export type Conversation = typeof conversations.$inferSelect;
export type Draft = typeof drafts.$inferSelect;
export type UserCredit = typeof userCredits.$inferSelect;
export type CreditUsage = typeof creditUsage.$inferSelect;
export type CreditTransaction = typeof creditTransactions.$inferSelect;
export type BrandFile = typeof brandFiles.$inferSelect;
export type SocialAccount = typeof socialAccounts.$inferSelect;
export type ScheduledPost = typeof scheduledPosts.$inferSelect;
export type Subscription = typeof subscriptions.$inferSelect;
export type PaymentRecord = typeof paymentRecords.$inferSelect;
export type CommentMonitor = typeof commentMonitors.$inferSelect;
export type IncomingComment = typeof incomingComments.$inferSelect;
export type BrandMember = typeof brandMembers.$inferSelect;
export type ReplySuggestion = typeof replySuggestions.$inferSelect;
