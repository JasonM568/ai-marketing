# Phase 2：品牌管理系統

## 📁 檔案清單（5 個檔案）

```
sql/002_seed_brands.sql                    ← Supabase 執行：seed 測試品牌
app/api/brands/route.ts                    ← API: GET 列表 / POST 新增
app/api/brands/[id]/route.ts               ← API: GET / PUT / DELETE 單一品牌
app/(dashboard)/brands/page.tsx            ← 覆蓋: 品牌列表頁（卡片式）
app/(dashboard)/brands/new/page.tsx        ← 新增: 新增品牌頁
app/(dashboard)/brands/[id]/page.tsx       ← 新增: 品牌詳情頁（6 Tabs + Markdown 編輯）
```

## 🚀 整合步驟

### Step 1：Supabase 執行 SQL

到 Supabase Dashboard → SQL Editor，執行 `sql/002_seed_brands.sql`

（注意：Phase 1 的 `sql/init.sql` 應該已經有 brands 表的 DDL，
 這個 002 只是加 trigger 和 seed 測試品牌「希望執行長」）

### Step 2：解壓並推上 GitHub

```bash
# 1. 在 ai-marketing 專案目錄中解壓
cd ~/你的路徑/ai-marketing
unzip ~/Downloads/phase2-brands.zip -o

# 2. 確認檔案
git status

# 3. 推上去
git add .
git commit -m "Phase 2: 品牌管理系統 — CRUD + 6 Tabs + Markdown 編輯"
git push origin main
```

### Step 3：驗證

1. 登入後 → 點 Sidebar「品牌管理」
2. 看到「希望執行長」品牌卡片
3. 點進去 → 6 個 Tab 都有內容（Markdown 渲染）
4. 編輯品牌聲音 → 儲存成功
5. 新增一個新品牌 → 跳轉到詳情頁

## ⚡ 技術細節

- 沿用 Phase 1 架構：Drizzle ORM + neon + jose cookie auth
- 使用已安裝的 `react-markdown` 做 Markdown 渲染
- API 用 `requireAuth()` 驗證（cookie-based，非 Bearer token）
- Schema 欄位名用 camelCase（Drizzle 風格）：brandCode, brandVoice, contentPillars 等
- 配色延續 Phase 1：gray-950 底 + blue-600 主色
- `(dashboard)` route group 下，自動套用 sidebar layout
