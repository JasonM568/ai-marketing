-- ===================================================
-- 011: 使用者上線時間追蹤
-- 執行位置: Supabase SQL Editor
-- ===================================================

ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP;
