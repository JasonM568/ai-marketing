import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "服務條款 | 惠邦行銷",
  description: "惠邦行銷 AI 內容產出系統服務條款",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-950 text-gray-200">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <Link href="/" className="text-gray-500 hover:text-gray-300 text-sm mb-8 inline-block">
          ← 回到首頁
        </Link>

        <h1 className="text-3xl font-bold text-white mb-2">服務條款</h1>
        <p className="text-gray-500 text-sm mb-8">最後更新日期：2026 年 3 月 6 日</p>

        <div className="space-y-8 text-gray-300 leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">1. 服務說明</h2>
            <p>
              「惠邦行銷 AI 內容產出系統」（以下簡稱「本服務」）由惠邦行銷有限公司（以下簡稱「本公司」）營運，提供 AI 行銷內容生成、社群平台排程發文、品牌管理等功能。
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">2. 帳號使用</h2>
            <ul className="list-disc list-inside space-y-2 ml-2">
              <li>您必須經由本公司核准方能取得帳號。</li>
              <li>您有責任妥善保管帳號憑證，並對帳號下的所有活動負責。</li>
              <li>如發現帳號遭未授權使用，請立即通知本公司。</li>
              <li>本公司保留在違反條款時暫停或終止帳號的權利。</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">3. 社群平台整合</h2>
            <ul className="list-disc list-inside space-y-2 ml-2">
              <li>您可以透過 OAuth 授權方式，連結 Meta 平台帳號（Facebook 粉絲專頁、Instagram 商業帳號、Threads）。</li>
              <li>連結社群帳號即表示您授權本服務代您管理及發布內容。</li>
              <li>您有責任確保發布的內容符合各社群平台的社群守則及使用條款。</li>
              <li>本服務使用的排程發文功能，需要您在發文前進行人工確認。</li>
              <li>您可以隨時在本服務中斷開社群帳號連結。</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">4. AI 生成內容</h2>
            <ul className="list-disc list-inside space-y-2 ml-2">
              <li>本服務利用 AI 技術協助生成行銷內容，但最終發布決定權在您。</li>
              <li>AI 生成的內容可能需要您的審閱和修改，以確保準確性和適當性。</li>
              <li>本公司不對 AI 生成內容的準確性、完整性或適用性作任何保證。</li>
              <li>您對使用 AI 生成內容所產生的任何後果負責。</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">5. 訂閱與付款</h2>
            <ul className="list-disc list-inside space-y-2 ml-2">
              <li>本服務提供不同等級的訂閱方案，各方案包含不同的使用額度（點數）。</li>
              <li>訂閱費用按月收取，透過綠界科技（ECPay）進行信用卡扣款。</li>
              <li>每月未使用的點數不會結轉至下月（除方案明確說明外）。</li>
              <li>取消訂閱將在當期結束後生效，當期已付費用不予退還。</li>
              <li>本公司保留調整方案價格的權利，價格變更將提前通知。</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">6. 使用限制</h2>
            <p className="mb-3">您同意不會：</p>
            <ul className="list-disc list-inside space-y-2 ml-2">
              <li>利用本服務發布違法、有害、騷擾、誹謗或不當內容。</li>
              <li>嘗試未經授權存取本服務的系統或其他用戶的資料。</li>
              <li>使用自動化工具（機器人）大量操作本服務。</li>
              <li>轉售、分享或轉讓您的帳號給第三方。</li>
              <li>違反 Meta 平台或其他第三方服務的使用條款。</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">7. 智慧財產權</h2>
            <ul className="list-disc list-inside space-y-2 ml-2">
              <li>本服務的軟體、介面設計、AI 模型及相關技術的智慧財產權歸本公司所有。</li>
              <li>您透過本服務建立的品牌資料和原創內容的權利歸您所有。</li>
              <li>AI 協助生成的內容，其使用權歸建立該內容的用戶所有。</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">8. 免責聲明</h2>
            <ul className="list-disc list-inside space-y-2 ml-2">
              <li>本服務以「現狀」提供，不作任何明示或暗示的保證。</li>
              <li>本公司不保證服務不會中斷或無錯誤。</li>
              <li>因第三方平台（Meta、ECPay 等）的政策變更或服務中斷所造成的影響，本公司不負責任。</li>
              <li>社群平台的發文結果取決於各平台的 API 狀態及政策。</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">9. 責任限制</h2>
            <p>
              在法律允許的最大範圍內，本公司對因使用或無法使用本服務所造成的任何間接、附帶、特殊、懲罰性或衍生性損害不承擔責任。本公司的賠償責任以您在事件發生前 12 個月內支付的服務費用為上限。
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">10. 條款修訂</h2>
            <p>
              本公司保留修訂本服務條款的權利。修訂後的條款將公布在本頁面。如有重大變更，我們會透過服務內通知告知您。繼續使用本服務即表示您同意修訂後的條款。
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">11. 準據法</h2>
            <p>
              本服務條款受中華民國法律管轄。如有任何爭議，雙方同意以臺灣臺北地方法院為第一審管轄法院。
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">12. 聯絡方式</h2>
            <p>如有任何關於服務條款的疑問，請聯絡我們：</p>
            <div className="mt-3 p-4 bg-gray-900/50 border border-gray-800 rounded-xl">
              <p>惠邦行銷有限公司</p>
              <p>電子郵件：<a href="mailto:support@huibang.ai" className="text-blue-400 hover:underline">support@huibang.ai</a></p>
            </div>
          </section>
        </div>

        <div className="mt-12 pt-6 border-t border-gray-800 text-gray-500 text-sm flex gap-4">
          <Link href="/privacy" className="hover:text-gray-300">隱私權政策</Link>
          <Link href="/data-deletion" className="hover:text-gray-300">資料刪除說明</Link>
        </div>
      </div>
    </div>
  );
}
