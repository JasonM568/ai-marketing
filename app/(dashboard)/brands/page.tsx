"use client";

export default function BrandsPage() {
  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">🏷️ 品牌管理</h1>
          <p className="text-gray-500 text-sm mt-1">管理所有品牌客戶的資料</p>
        </div>
        <button
          disabled
          className="px-4 py-2 bg-blue-600/50 text-white/50 rounded-xl text-sm cursor-not-allowed"
        >
          + 新增品牌
        </button>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-2xl p-12 text-center">
        <div className="text-4xl mb-3">🏗️</div>
        <p className="text-gray-400">品牌管理功能將在 Phase 2 建立</p>
      </div>
    </div>
  );
}
