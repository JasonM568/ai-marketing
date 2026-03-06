-- ===================================================
-- v1.7: Social Accounts + Scheduled Posts
-- ===================================================

-- 1. Social Accounts (OAuth tokens per brand per platform)
CREATE TABLE IF NOT EXISTS social_accounts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  platform VARCHAR(20) NOT NULL,
  platform_user_id VARCHAR(100),
  platform_username VARCHAR(100),
  page_id VARCHAR(100),
  access_token TEXT NOT NULL,
  token_expires_at TIMESTAMP,
  scopes TEXT,
  meta_user_id VARCHAR(100),
  connected_by UUID REFERENCES admin_users(id),
  status VARCHAR(20) DEFAULT 'active' NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
  UNIQUE(brand_id, platform)
);

-- 2. Scheduled Posts
CREATE TABLE IF NOT EXISTS scheduled_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  draft_id UUID REFERENCES drafts(id) ON DELETE SET NULL,
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  social_account_id UUID NOT NULL REFERENCES social_accounts(id),
  platform VARCHAR(20) NOT NULL,
  content TEXT NOT NULL,
  image_url TEXT,
  scheduled_at TIMESTAMP NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' NOT NULL,
  published_post_id VARCHAR(200),
  publish_error TEXT,
  retry_count INTEGER DEFAULT 0,
  created_by UUID NOT NULL REFERENCES admin_users(id),
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- 3. Indexes
CREATE INDEX IF NOT EXISTS idx_social_accounts_brand_id ON social_accounts(brand_id);
CREATE INDEX IF NOT EXISTS idx_social_accounts_status ON social_accounts(status);
CREATE INDEX IF NOT EXISTS idx_scheduled_posts_brand_id ON scheduled_posts(brand_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_posts_status ON scheduled_posts(status);
CREATE INDEX IF NOT EXISTS idx_scheduled_posts_scheduled_at ON scheduled_posts(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_scheduled_posts_created_by ON scheduled_posts(created_by);
