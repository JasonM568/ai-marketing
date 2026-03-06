-- ===================================================
-- v1.5: 訂閱點數系統
-- 執行位置: Supabase SQL Editor
-- ===================================================

-- 1. admin_users 新增 plan_id 欄位
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'admin_users' AND column_name = 'plan_id'
  ) THEN
    ALTER TABLE admin_users ADD COLUMN plan_id VARCHAR(20);
  END IF;
END $$;

-- 2. 用戶點數餘額表
CREATE TABLE IF NOT EXISTS user_credits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES admin_users(id),
  balance INTEGER DEFAULT 0 NOT NULL,
  monthly_quota INTEGER DEFAULT 0 NOT NULL,
  carry_over INTEGER DEFAULT 0 NOT NULL,
  max_brands INTEGER DEFAULT 1 NOT NULL,
  current_period_start TIMESTAMP,
  current_period_end TIMESTAMP,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- 3. 點數使用記錄表
CREATE TABLE IF NOT EXISTS credit_usage (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES admin_users(id),
  agent_id UUID,
  brand_id UUID,
  conversation_id UUID,
  credits_used INTEGER NOT NULL,
  content_type VARCHAR(30) NOT NULL,
  input_tokens INTEGER DEFAULT 0,
  output_tokens INTEGER DEFAULT 0,
  description VARCHAR(200),
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- 4. 點數異動記錄表
CREATE TABLE IF NOT EXISTS credit_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES admin_users(id),
  type VARCHAR(20) NOT NULL,
  amount INTEGER NOT NULL,
  balance_after INTEGER NOT NULL,
  description VARCHAR(200),
  created_by UUID,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- 5. 建立索引
CREATE INDEX IF NOT EXISTS idx_user_credits_user_id ON user_credits(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_usage_user_id ON credit_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_usage_created_at ON credit_usage(created_at);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_id ON credit_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_created_at ON credit_transactions(created_at);

-- ===================================================
-- 完成！接下來在後台「帳號管理」頁面指派方案即可
-- ===================================================
