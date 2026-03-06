-- ============================================
-- AI Marketing Agent - Database Tables
-- 在 Supabase SQL Editor 執行
-- ============================================

-- 品牌資料表
CREATE TABLE IF NOT EXISTS brands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_code VARCHAR(30) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  industry VARCHAR(50),
  status VARCHAR(20) DEFAULT 'active' NOT NULL,
  brand_voice TEXT,
  icp TEXT,
  services TEXT,
  content_pillars TEXT,
  past_hits TEXT,
  brand_story TEXT,
  ad_config JSONB,
  crm_config JSONB,
  platforms JSONB DEFAULT '["ig","fb","threads","line","reels","ads","blog"]'::jsonb,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- AI 代理表
CREATE TABLE IF NOT EXISTS agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_code VARCHAR(30) UNIQUE NOT NULL,
  name VARCHAR(50) NOT NULL,
  role VARCHAR(100) NOT NULL,
  category VARCHAR(20) NOT NULL,
  icon VARCHAR(10),
  description TEXT,
  system_prompt TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true NOT NULL,
  sort_order INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- 草稿 / 產出記錄表
CREATE TABLE IF NOT EXISTS drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID REFERENCES brands(id),
  agent_id UUID REFERENCES agents(id),
  created_by UUID REFERENCES admin_users(id),
  platform VARCHAR(20),
  topic VARCHAR(200),
  content TEXT NOT NULL,
  metadata JSONB,
  status VARCHAR(20) DEFAULT 'draft' NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- 對話歷史表
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID REFERENCES brands(id),
  agent_id UUID REFERENCES agents(id),
  created_by UUID REFERENCES admin_users(id),
  title VARCHAR(200),
  messages JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- 確認 admin_users 已有 role 欄位
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'admin_users' AND column_name = 'role'
  ) THEN
    ALTER TABLE admin_users ADD COLUMN role VARCHAR(20) DEFAULT 'editor' NOT NULL;
  END IF;
END $$;
