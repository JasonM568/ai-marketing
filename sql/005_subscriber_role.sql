-- ============================================
-- AI Marketing Agent - v1.3 Migration
-- 新增訂閱會員角色 + 品牌歸屬
-- 在 Supabase SQL Editor 執行
-- ============================================

-- 1. brands 表新增 created_by 欄位（品牌歸屬）
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'brands' AND column_name = 'created_by'
  ) THEN
    ALTER TABLE brands ADD COLUMN created_by UUID REFERENCES admin_users(id);
  END IF;
END $$;

-- 2. 確認 admin_users.role 允許 'subscriber' 值
-- （目前 role 欄位是 VARCHAR(20)，已可容納 'subscriber'）

-- 3. 為既有品牌設定歸屬（全部歸給第一位 admin）
UPDATE brands
SET created_by = (
  SELECT id FROM admin_users WHERE role = 'admin' LIMIT 1
)
WHERE created_by IS NULL;

-- 4. 建立索引加速查詢
CREATE INDEX IF NOT EXISTS idx_brands_created_by ON brands(created_by);
CREATE INDEX IF NOT EXISTS idx_drafts_created_by ON drafts(created_by);
CREATE INDEX IF NOT EXISTS idx_conversations_created_by ON conversations(created_by);

-- ============================================
-- 新增訂閱會員帳號範例（取消註解即可使用）
-- 密碼需要先用 bcrypt hash 過
-- ============================================
-- INSERT INTO admin_users (email, password_hash, name, role)
-- VALUES ('subscriber@example.com', '$2b$10$YOUR_HASH_HERE', '測試會員', 'subscriber');
