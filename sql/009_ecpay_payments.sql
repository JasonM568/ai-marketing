-- ============================================
-- v1.8: ECPay 訂閱金流
-- ============================================

-- 訂閱紀錄表
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES admin_users(id),
  plan_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'active', 'past_due', 'cancelled', 'expired')),

  -- ECPay 資訊
  ecpay_merchant_trade_no TEXT UNIQUE,
  ecpay_period_type TEXT DEFAULT 'M',
  ecpay_card_last4 TEXT,

  -- 訂閱期間
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  cancelled_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 付款紀錄表
CREATE TABLE IF NOT EXISTS payment_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  subscription_id UUID REFERENCES subscriptions(id),
  user_id UUID NOT NULL REFERENCES admin_users(id),

  -- ECPay 資訊
  ecpay_merchant_trade_no TEXT NOT NULL,
  ecpay_trade_no TEXT,

  -- 方案與金額
  plan_id TEXT NOT NULL,
  amount INTEGER NOT NULL,

  -- 狀態
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'paid', 'failed', 'refunded')),
  payment_type TEXT NOT NULL DEFAULT 'initial'
    CHECK (payment_type IN ('initial', 'recurring', 'upgrade', 'downgrade')),

  -- ECPay 原始回傳
  raw_callback JSONB,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_payment_records_user ON payment_records(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_records_subscription ON payment_records(subscription_id);
CREATE INDEX IF NOT EXISTS idx_payment_records_merchant_trade ON payment_records(ecpay_merchant_trade_no);
