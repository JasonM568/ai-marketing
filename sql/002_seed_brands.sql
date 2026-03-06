-- ============================================
-- Phase 2: 品牌管理系統 — Seed 測試資料
-- 在 Supabase SQL Editor 執行
-- ============================================

-- 先確認 brands 表已建立（Phase 1 的 init.sql 應該已經建了）
-- 如果還沒跑過 init.sql，請先執行 sql/init.sql

-- 加入 updated_at 自動更新觸發器
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 只有不存在才建立
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_brands_updated_at'
  ) THEN
    CREATE TRIGGER trigger_brands_updated_at
      BEFORE UPDATE ON brands
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at();
  END IF;
END $$;

-- 插入第一個測試品牌
INSERT INTO brands (brand_code, name, industry, status, brand_voice, icp, services, content_pillars, past_hits, brand_story, platforms)
VALUES (
  'hopeceo',
  '希望執行長 Hope CEO',
  '個人品牌 / 創業教育',
  'active',
  E'## 語氣風格\n\n- **溫暖但專業**：像一位有經驗的學長姐在分享實戰經驗\n- **務實導向**：不說空話，每一句都要有行動力\n- **鼓勵但不雞湯**：用數據和案例說話，而不是空泛的正能量\n- **口語化**：適度使用「你」「我們」，拉近距離\n- **金句感**：每篇要有 1-2 句可以被截圖分享的金句',

  E'## 目標受眾 ICP\n\n### 主要受眾\n- **年齡**：25-40 歲\n- **身份**：創業者、自由工作者、想轉型的上班族\n- **痛點**：不知道怎麼開始、害怕失敗、缺乏系統性方法\n- **渴望**：財務自由、時間自由、建立個人品牌\n\n### 次要受眾\n- 對商業有興趣的大學生\n- 想發展副業的職場人士',

  E'## 產品服務\n\n1. **線上課程**：創業實戰系列課程\n2. **一對一諮詢**：商業模式診斷、品牌定位\n3. **社群會員**：月費制創業者社群\n4. **工作坊**：不定期實體/線上工作坊\n5. **免費內容**：IG / FB / YouTube 教學內容',

  E'## 內容策略支柱\n\n### 1. 創業實戰分享 (40%)\n分享真實的創業經驗、踩過的坑、學到的教訓\n\n### 2. 方法論教學 (30%)\n系統性的商業知識：行銷、財務、管理、品牌\n\n### 3. 學員案例 (15%)\n學員成功故事、轉型歷程、成果展示\n\n### 4. 個人生活 (15%)\n適度的生活分享，展現真實的一面，拉近距離',

  E'## 高成效參考\n\n### 貼文模式\n1. **「我當初也...」開頭**：用自身經歷引起共鳴，互動率平均 8%+\n2. **數字對比法**：「從月薪 3 萬到月收 30 萬」，觸及率高 2 倍\n3. **反直覺觀點**：「不要輕易辭職去創業」，留言數平均多 3 倍\n\n### 最佳發文時間\n- IG：週二、四 20:00-21:00\n- FB：週三、五 12:00-13:00',

  E'## 品牌故事\n\nHope CEO（希望執行長）由創辦人於 2022 年創立，從一個 Instagram 帳號起步，分享自己從上班族轉型為創業者的歷程。\n\n品牌核心理念是：**「每個人都有能力成為自己人生的執行長」**。\n\n透過真實的經驗分享和系統化的教學方法，已幫助超過 500 位學員踏出創業第一步。品牌強調的不是快速致富，而是建立可持續的商業模式和心態。',

  '["ig", "fb", "threads", "line", "reels"]'::jsonb
)
ON CONFLICT (brand_code) DO NOTHING;

-- 驗證
SELECT id, brand_code, name, industry, status FROM brands;
