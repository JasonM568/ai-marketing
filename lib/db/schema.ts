import { pgTable, uuid, varchar, text, boolean, integer, timestamp, jsonb } from "drizzle-orm/pg-core";

// ===== 既有表 =====

export const adminUsers = pgTable("admin_users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: varchar("email", { length: 255 }).unique().notNull(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  name: varchar("name", { length: 100 }),
  role: varchar("role", { length: 20 }).default("admin").notNull(),
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

// Type exports
export type Brand = typeof brands.$inferSelect;
export type Agent = typeof agents.$inferSelect;
export type Conversation = typeof conversations.$inferSelect;
export type Draft = typeof drafts.$inferSelect;
