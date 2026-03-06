-- v1.9: Comment monitoring + AI auto-reply system

-- Comment monitors: track which posts/accounts to monitor
CREATE TABLE IF NOT EXISTS comment_monitors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  social_account_id UUID NOT NULL REFERENCES social_accounts(id) ON DELETE CASCADE,
  platform VARCHAR(20) NOT NULL,
  monitor_mode VARCHAR(20) NOT NULL DEFAULT 'specific',  -- 'specific' | 'all'
  published_post_id VARCHAR(200),    -- specific mode: post ID; all mode: NULL
  post_content_preview TEXT,          -- first 100 chars of original post for UI
  status VARCHAR(20) DEFAULT 'active' NOT NULL,  -- 'active' | 'paused'
  created_by UUID NOT NULL REFERENCES admin_users(id),
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Incoming comments received from webhooks
CREATE TABLE IF NOT EXISTS incoming_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  monitor_id UUID REFERENCES comment_monitors(id) ON DELETE SET NULL,
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  platform VARCHAR(20) NOT NULL,
  platform_comment_id VARCHAR(200) NOT NULL UNIQUE,
  platform_post_id VARCHAR(200) NOT NULL,
  parent_comment_id VARCHAR(200),
  commenter_name VARCHAR(200),
  commenter_id VARCHAR(200),
  comment_text TEXT NOT NULL,
  comment_timestamp TIMESTAMP,
  status VARCHAR(20) DEFAULT 'new' NOT NULL,  -- 'new' | 'processing' | 'replied' | 'ignored' | 'error'
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- AI-generated reply suggestions
CREATE TABLE IF NOT EXISTS reply_suggestions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  comment_id UUID NOT NULL REFERENCES incoming_comments(id) ON DELETE CASCADE,
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  suggested_text TEXT NOT NULL,
  ai_model VARCHAR(50) DEFAULT 'claude-sonnet-4-20250514',
  status VARCHAR(20) DEFAULT 'pending' NOT NULL,  -- 'pending' | 'approved' | 'edited' | 'rejected' | 'posted'
  edited_text TEXT,
  posted_reply_id VARCHAR(200),
  posted_at TIMESTAMP,
  reviewed_by UUID REFERENCES admin_users(id),
  reviewed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_comment_monitors_brand ON comment_monitors(brand_id);
CREATE INDEX IF NOT EXISTS idx_comment_monitors_account ON comment_monitors(social_account_id);
CREATE INDEX IF NOT EXISTS idx_comment_monitors_post ON comment_monitors(published_post_id);
CREATE INDEX IF NOT EXISTS idx_incoming_comments_monitor ON incoming_comments(monitor_id);
CREATE INDEX IF NOT EXISTS idx_incoming_comments_status ON incoming_comments(status);
CREATE INDEX IF NOT EXISTS idx_incoming_comments_brand ON incoming_comments(brand_id);
CREATE INDEX IF NOT EXISTS idx_incoming_comments_platform_id ON incoming_comments(platform_comment_id);
CREATE INDEX IF NOT EXISTS idx_reply_suggestions_comment ON reply_suggestions(comment_id);
CREATE INDEX IF NOT EXISTS idx_reply_suggestions_status ON reply_suggestions(status);
CREATE INDEX IF NOT EXISTS idx_reply_suggestions_brand ON reply_suggestions(brand_id);
