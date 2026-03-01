import { pgTable, uuid, varchar, text, boolean, integer, timestamp, jsonb } from "drizzle-orm/pg-core";

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

// Type exports
export type Brand = typeof brands.$inferSelect;
export type Agent = typeof agents.$inferSelect;
export type Conversation = typeof conversations.$inferSelect;
export type Draft = typeof drafts.$inferSelect;
export type UserCredit = typeof userCredits.$inferSelect;
export type CreditUsage = typeof creditUsage.$inferSelect;
export type CreditTransaction = typeof creditTransactions.$inferSelect;
