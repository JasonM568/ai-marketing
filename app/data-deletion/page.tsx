import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "資料刪除說明 | 惠邦行銷",
  description: "惠邦行銷 AI 內容產出系統資料刪除說明",
};

export default function DataDeletionPage() {
  return (
    <div className="min-h-screen bg-gray-950 text-gray-200">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <Link href="/" className="text-gray-500 hover:text-gray-300 text-sm mb-8 inline-block">
          ← 回到首頁
        </Link>

        <h1 className="text-3xl font-bold text-white mb-2">資料刪除說明</h1>
        <p className="text-gray-500 text-sm mb-8">最後更新日期：2026 年 3 月 6 日</p>

        <div className="space-y-8 text-gray-300 leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">概述</h2>
            <p>
              根據 Meta 平台政策及個人資料保護法規，您有權要求刪除本服務所儲存的個人資料。本頁面說明您可以如何行使此權利。
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">自助操作</h2>
            <p className="mb-4">您可以在本服務中自行執行以下操作：</p>

            <div className="space-y-4">
              <div className="p-4 bg-gray-900/50 border border-gray-800 rounded-xl">
                <h3 className="text-white font-medium mb-2">1. 斷開社群帳號連結</h3>
                <p className="text-sm">
                  前往「品牌管理」→ 選擇品牌 →「社群帳號」分頁 → 點擊「斷開連結」。這將立即刪除我們儲存的該社群帳號 Access Token 及相關連結資料。
                </p>
              </div>

              <div className="p-4 bg-gray-900/50 border border-gray-800 rounded-xl">
                <h3 className="text-white font-medium mb-2">2. 從 Meta 撤回授權</h3>
                <p className="text-sm">
                  您也可以直接在 Facebook 設定中撤回應用程式授權：<br />
                  Facebook →「設定與隱私」→「設定」→「應用程式和網站」→ 找到「惠邦行銷」→「移除」。
                </p>
              </div>

              <div className="p-4 bg-gray-900/50 border border-gray-800 rounded-xl">
                <h3 className="text-white font-medium mb-2">3. 取消訂閱</h3>
                <p className="text-sm">
                  前往「我的方案」頁面 → 點擊「取消訂閱」。取消後將不再進行定期扣款，且訂閱於當期結束後失效。
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">完整資料刪除申請</h2>
            <p className="mb-4">
              如果您希望完整刪除在本服務中的所有資料（包括帳號、品牌資料、草稿、排程貼文、訂閱紀錄等），請透過以下方式提出申請：
            </p>

            <div className="p-4 bg-blue-900/20 border border-blue-800/50 rounded-xl">
              <p className="font-medium text-white mb-2">📧 寄送電子郵件至</p>
              <a href="mailto:privacy@huibang.ai" className="text-blue-400 hover:underline text-lg">
                privacy@huibang.ai
              </a>
              <p className="text-sm text-gray-400 mt-2">
                請在信件中提供您的帳號電子郵件地址，以及需要刪除的資料範圍。
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">刪除範圍</h2>
            <p className="mb-3">完整資料刪除將包括：</p>
            <ul className="list-disc list-inside space-y-2 ml-2">
              <li>您的使用者帳號資料</li>
              <li>所有品牌資料及設定</li>
              <li>AI 生成的行銷草稿</li>
              <li>排程貼文紀錄</li>
              <li>社群帳號連結及 Access Token（加密儲存的）</li>
              <li>訂閱及付款紀錄</li>
              <li>點數使用紀錄</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">處理時程</h2>
            <ul className="list-disc list-inside space-y-2 ml-2">
              <li>自助操作（斷開連結、取消訂閱）：<strong>即時生效</strong></li>
              <li>完整資料刪除申請：收到申請後 <strong>30 個工作天</strong>內完成處理</li>
              <li>我們會在處理完成後以電子郵件通知您</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">注意事項</h2>
            <ul className="list-disc list-inside space-y-2 ml-2">
              <li>資料刪除後將<strong>無法復原</strong>，請確認已備份所需資料。</li>
              <li>已發布到社群平台的貼文不會因此被刪除（需在各平台自行管理）。</li>
              <li>依法律要求需保留的資料（如交易紀錄），將在法定保留期限屆滿後刪除。</li>
              <li>如果您仍有有效的訂閱，請先取消訂閱後再申請資料刪除。</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">Meta 資料刪除回調</h2>
            <p>
              當您在 Facebook 設定中移除本應用程式的授權時，Meta 會通知我們的系統。我們收到通知後，會自動刪除與您的 Facebook/Instagram 帳號相關的所有資料，包括 Access Token 及帳號連結資訊。
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">聯絡我們</h2>
            <p>如有任何關於資料刪除的疑問，請聯絡我們：</p>
            <div className="mt-3 p-4 bg-gray-900/50 border border-gray-800 rounded-xl">
              <p>惠邦行銷有限公司</p>
              <p>電子郵件：<a href="mailto:privacy@huibang.ai" className="text-blue-400 hover:underline">privacy@huibang.ai</a></p>
            </div>
          </section>
        </div>

        <div className="mt-12 pt-6 border-t border-gray-800 text-gray-500 text-sm flex gap-4">
          <Link href="/privacy" className="hover:text-gray-300">隱私權政策</Link>
          <Link href="/terms" className="hover:text-gray-300">服務條款</Link>
        </div>
      </div>
    </div>
  );
}
