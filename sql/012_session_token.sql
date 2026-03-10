-- ===================================================
-- 012: 單裝置登入 session token
-- 執行位置: Supabase SQL Editor
-- ===================================================

ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS session_token VARCHAR(255);
