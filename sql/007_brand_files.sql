-- ===================================================
-- v1.6: 品牌參考資料檔案表
-- 執行位置: Supabase SQL Editor
-- ===================================================

CREATE TABLE IF NOT EXISTS brand_files (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  file_name VARCHAR(255) NOT NULL,
  file_type VARCHAR(50) NOT NULL,
  file_size INTEGER NOT NULL,
  storage_path VARCHAR(500) NOT NULL,
  extracted_text TEXT,
  uploaded_by UUID REFERENCES admin_users(id),
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_brand_files_brand_id ON brand_files(brand_id);
CREATE INDEX IF NOT EXISTS idx_brand_files_uploaded_by ON brand_files(uploaded_by);
