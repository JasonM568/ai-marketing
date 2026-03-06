"use client";

import Link from "next/link";

export default function CheckoutSuccessPage() {
  return (
    <div className="max-w-lg mx-auto py-16 px-4 text-center">
      <div className="text-6xl mb-6">🎉</div>
      <h1 className="text-2xl font-bold text-white mb-3">訂閱成功！</h1>
      <p className="text-gray-400 mb-8">
        感謝您的訂閱，方案點數已自動啟用。您可以立即開始使用所有功能。
      </p>

      <div className="space-y-3">
        <Link
          href="/my-plan"
          className="block w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-medium transition-colors"
        >
          查看我的方案
        </Link>
        <Link
          href="/workspace"
          className="block w-full py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-xl font-medium transition-colors"
        >
          前往工作台
        </Link>
      </div>

      <div className="mt-8 text-xs text-gray-600">
        <p>如有任何問題，請聯繫客服支援。</p>
        <p>帳單紀錄可在 <Link href="/billing" className="text-blue-400 hover:text-blue-300">帳單頁面</Link> 查看。</p>
      </div>
    </div>
  );
}
