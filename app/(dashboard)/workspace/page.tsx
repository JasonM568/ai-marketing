"use client";

export default function WorkspacePage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">✨ 工作台</h1>
        <p className="text-gray-500 text-sm mt-1">選擇品牌與代理，開始產出內容</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Quick actions */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-blue-500/30 transition-colors">
          <div className="text-3xl mb-3">📱</div>
          <h3 className="font-semibold text-white mb-1">社群貼文</h3>
          <p className="text-sm text-gray-500">IG / FB / Threads / LINE</p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-blue-500/30 transition-colors">
          <div className="text-3xl mb-3">📢</div>
          <h3 className="font-semibold text-white mb-1">廣告文案</h3>
          <p className="text-sm text-gray-500">Meta / Google 付費廣告</p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-blue-500/30 transition-colors">
          <div className="text-3xl mb-3">📧</div>
          <h3 className="font-semibold text-white mb-1">電子報</h3>
          <p className="text-sm text-gray-500">EDM / 歡迎信 / 再行銷信</p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-blue-500/30 transition-colors">
          <div className="text-3xl mb-3">🔍</div>
          <h3 className="font-semibold text-white mb-1">SEO 文章</h3>
          <p className="text-sm text-gray-500">部落格 / Meta 標籤</p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-blue-500/30 transition-colors">
          <div className="text-3xl mb-3">🎬</div>
          <h3 className="font-semibold text-white mb-1">短影音腳本</h3>
          <p className="text-sm text-gray-500">Reels / Shorts</p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-blue-500/30 transition-colors">
          <div className="text-3xl mb-3">📊</div>
          <h3 className="font-semibold text-white mb-1">策略分析</h3>
          <p className="text-sm text-gray-500">品牌策略 / 數據分析</p>
        </div>
      </div>

      <div className="mt-8 p-6 bg-blue-600/10 border border-blue-500/20 rounded-2xl">
        <p className="text-blue-400 text-sm">
          💡 <strong>Phase 1 完成</strong> — 專案骨架與登入系統已就緒。Phase 2 將建立品牌管理系統。
        </p>
      </div>
    </div>
  );
}
