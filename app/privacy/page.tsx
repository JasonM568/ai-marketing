import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "隱私權政策 | 惠邦行銷",
  description: "惠邦行銷 AI 內容產出系統隱私權政策",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-950 text-gray-200">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <Link href="/" className="text-gray-500 hover:text-gray-300 text-sm mb-8 inline-block">
          ← 回到首頁
        </Link>

        <h1 className="text-3xl font-bold text-white mb-2">隱私權政策</h1>
        <p className="text-gray-500 text-sm mb-8">最後更新日期：2026 年 3 月 6 日</p>

        <div className="space-y-8 text-gray-300 leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">1. 總則</h2>
            <p>
              惠邦行銷有限公司（以下簡稱「本公司」）重視您的隱私權。本隱私權政策說明我們如何收集、使用、儲存及保護您在使用「惠邦行銷 AI 內容產出系統」（以下簡稱「本服務」）時提供的個人資料。
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">2. 我們收集的資料</h2>
            <p className="mb-3">當您使用本服務時，我們可能收集以下類型的資料：</p>
            <ul className="list-disc list-inside space-y-2 ml-2">
              <li><strong>帳號資料：</strong>您的姓名、電子郵件地址、公司名稱。</li>
              <li><strong>社群帳號資料：</strong>當您連結 Meta 平台（Facebook、Instagram、Threads）時，我們會取得您授權的粉絲專頁名稱、頁面 ID、商業帳號 ID 及存取權杖（Access Token）。</li>
              <li><strong>內容資料：</strong>您透過本服務建立的品牌資料、行銷草稿、排程貼文等內容。</li>
              <li><strong>付款資料：</strong>訂閱方案相關的交易紀錄。我們不直接儲存信用卡號碼，付款由綠界科技（ECPay）安全處理。</li>
              <li><strong>使用紀錄：</strong>登入時間、功能使用情況等系統日誌。</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">3. 資料用途</h2>
            <p className="mb-3">我們收集的資料僅用於以下目的：</p>
            <ul className="list-disc list-inside space-y-2 ml-2">
              <li>提供及維護本服務的功能運作。</li>
              <li>代您在已授權的社群平台上發布內容。</li>
              <li>處理訂閱付款及帳務管理。</li>
              <li>發送服務相關通知（如 Token 即將到期提醒）。</li>
              <li>改善服務品質及使用體驗。</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">4. 資料儲存與安全</h2>
            <ul className="list-disc list-inside space-y-2 ml-2">
              <li>所有社群平台的存取權杖均以 AES-256-GCM 加密方式儲存。</li>
              <li>資料儲存在受保護的雲端資料庫中，並採用傳輸層加密（TLS）。</li>
              <li>我們定期審視安全措施，確保資料受到妥善保護。</li>
              <li>Meta 平台的存取權杖有效期約為 60 天，系統會在到期前自動刷新。</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">5. 資料分享</h2>
            <p className="mb-3">我們不會販售您的個人資料。僅在以下情況下可能分享資料：</p>
            <ul className="list-disc list-inside space-y-2 ml-2">
              <li><strong>Meta 平台：</strong>代您發布內容時，會透過 Meta Graph API 傳送貼文內容。</li>
              <li><strong>綠界科技（ECPay）：</strong>處理訂閱付款時，會傳送必要的交易資料。</li>
              <li><strong>法律要求：</strong>依法令規定或政府機關要求時。</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">6. 第三方服務</h2>
            <p>本服務使用以下第三方服務，各有其隱私權政策：</p>
            <ul className="list-disc list-inside space-y-2 ml-2 mt-2">
              <li>Meta Platform（Facebook、Instagram、Threads）— <a href="https://www.facebook.com/privacy/policy/" className="text-blue-400 hover:underline" target="_blank" rel="noopener noreferrer">Meta 隱私權政策</a></li>
              <li>綠界科技 ECPay — <a href="https://www.ecpay.com.tw/Privacy" className="text-blue-400 hover:underline" target="_blank" rel="noopener noreferrer">ECPay 隱私權政策</a></li>
              <li>Vercel（託管服務）</li>
              <li>OpenAI / Anthropic（AI 內容生成）</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">7. 您的權利</h2>
            <p className="mb-3">您享有以下權利：</p>
            <ul className="list-disc list-inside space-y-2 ml-2">
              <li><strong>存取權：</strong>您可以隨時查看您的帳號資料及已連結的社群帳號。</li>
              <li><strong>更正權：</strong>您可以更新您的品牌資料和帳號資訊。</li>
              <li><strong>刪除權：</strong>您可以要求刪除您的帳號及所有相關資料。請參閱我們的<Link href="/data-deletion" className="text-blue-400 hover:underline">資料刪除說明</Link>。</li>
              <li><strong>撤回授權：</strong>您可以隨時在本服務中斷開社群帳號連結，或在 Meta 平台的設定中撤回應用程式授權。</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">8. Cookie 政策</h2>
            <p>
              本服務使用必要的 Cookie 來維持您的登入狀態（JWT Token）。我們不使用追蹤型 Cookie 或第三方廣告 Cookie。
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">9. 政策修訂</h2>
            <p>
              本公司保留修訂本隱私權政策的權利。如有重大變更，我們會透過服務內通知或電子郵件告知您。繼續使用本服務即表示您同意修訂後的政策。
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">10. 聯絡我們</h2>
            <p>如有任何關於隱私權的疑問，請聯絡我們：</p>
            <div className="mt-3 p-4 bg-gray-900/50 border border-gray-800 rounded-xl">
              <p>惠邦行銷有限公司</p>
              <p>電子郵件：<a href="mailto:privacy@huibang.ai" className="text-blue-400 hover:underline">privacy@huibang.ai</a></p>
            </div>
          </section>
        </div>

        <div className="mt-12 pt-6 border-t border-gray-800 text-gray-500 text-sm flex gap-4">
          <Link href="/terms" className="hover:text-gray-300">服務條款</Link>
          <Link href="/data-deletion" className="hover:text-gray-300">資料刪除說明</Link>
        </div>
      </div>
    </div>
  );
}
