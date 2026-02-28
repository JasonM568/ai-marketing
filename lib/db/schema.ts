import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  jsonb,
  boolean,
  integer,
} from "drizzle-orm/pg-core";

// ===== 共用：後台管理員（與官網共用同一張表）=====
export const adminUsers = pgTable("admin_users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: varchar("email", { length: 100 }).unique().notNull(),
  passwordHash: varchar("password_hash", { length: 200 }).notNull(),
  name: varchar("name", { length: 50 }),
  role: varchar("role", { length: 20 }).default("editor").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ===== 品牌資料 =====
export const brands = pgTable("brands", {
  id: uuid("id").primaryKey().defaultRandom(),
  brandCode: varchar("brand_code", { length: 30 }).unique().notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  industry: varchar("industry", { length: 50 }),
  status: varchar("status", { length: 20 }).default("active").notNull(),
  // status: active / draft / inactive

  // 品牌核心資料（Markdown）
  brandVoice: text("brand_voice"),
  icp: text("icp"),
  services: text("services"),
  contentPillars: text("content_pillars"),
  pastHits: text("past_hits"),
  brandStory: text("brand_story"),

  // 進階設定（JSON）
  adConfig: jsonb("ad_config"),
  crmConfig: jsonb("crm_config"),
  platforms: jsonb("platforms"), // ["ig", "fb", "threads", "line", "edm", "reels", "ads", "blog"]

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ===== AI 代理 =====
export const agents = pgTable("agents", {
  id: uuid("id").primaryKey().defaultRandom(),
  agentCode: varchar("agent_code", { length: 30 }).unique().notNull(),
  name: varchar("name", { length: 50 }).notNull(),
  role: varchar("role", { length: 100 }).notNull(),
  category: varchar("category", { length: 20 }).notNull(), // content / strategy
  icon: varchar("icon", { length: 10 }),
  description: text("description"),
  systemPrompt: text("system_prompt").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  sortOrder: integer("sort_order").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ===== 草稿 / 產出記錄 =====
export const drafts = pgTable("drafts", {
  id: uuid("id").primaryKey().defaultRandom(),
  brandId: uuid("brand_id").references(() => brands.id),
  agentId: uuid("agent_id").references(() => agents.id),
  createdBy: uuid("created_by").references(() => adminUsers.id),

  platform: varchar("platform", { length: 20 }),
  topic: varchar("topic", { length: 200 }),
  content: text("content").notNull(),
  metadata: jsonb("metadata"), // { tone, audience, cta, hashtags, etc. }

  status: varchar("status", { length: 20 }).default("draft").notNull(),
  // status: draft / reviewed / published

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ===== 對話歷史 =====
export const conversations = pgTable("conversations", {
  id: uuid("id").primaryKey().defaultRandom(),
  brandId: uuid("brand_id").references(() => brands.id),
  agentId: uuid("agent_id").references(() => agents.id),
  createdBy: uuid("created_by").references(() => adminUsers.id),

  title: varchar("title", { length: 200 }),
  messages: jsonb("messages").notNull(), // [{ role, content, timestamp }]

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ===== Types =====
export type AdminUser = typeof adminUsers.$inferSelect;
export type Brand = typeof brands.$inferSelect;
export type NewBrand = typeof brands.$inferInsert;
export type Agent = typeof agents.$inferSelect;
export type Draft = typeof drafts.$inferSelect;
export type Conversation = typeof conversations.$inferSelect;
