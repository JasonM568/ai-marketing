"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  createdAt: string;
  lastLoginAt: string | null;
  monthlyTokens: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
    creditsUsed: number;
    usageCount: number;
  };
}

function formatTimeAgo(dateStr: string | null): string {
  if (!dateStr) return "尚未登入";
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "剛剛";
  if (mins < 60) return `${mins} 分鐘前`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} 小時前`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} 天前`;
  return new Date(dateStr).toLocaleDateString("zh-TW");
}

function formatTokens(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
}

const ROLE_MAP: Record<string, { label: string; cls: string }> = {
  admin: { label: "管理員", cls: "bg-red-500/10 text-red-400 border-red-500/20" },
  master: { label: "Master", cls: "bg-purple-500/10 text-purple-400 border-purple-500/20" },
  editor: { label: "編輯", cls: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
  subscriber: { label: "訂閱會員", cls: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
};

export default function UsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [form, setForm] = useState({ email: "", password: "", name: "", role: "subscriber" });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [currentUserId, setCurrentUserId] = useState("");
  const [currentUserRole, setCurrentUserRole] = useState("admin");
  const [planModal, setPlanModal] = useState<User | null>(null);
  const [selectedPlan, setSelectedPlan] = useState("");
  const [planSaving, setPlanSaving] = useState(false);
  const [planError, setPlanError] = useState("");
  const [adjustModal, setAdjustModal] = useState<User | null>(null);
  const [adjustAmount, setAdjustAmount] = useState("");
  const [adjustDesc, setAdjustDesc] = useState("");

  const PLANS = [
    { id: "basic", name: "🌱 基礎版", price: "NT$999/月", credits: "30 點/月", brands: "1 品牌" },
    { id: "pro", name: "🚀 進階版", price: "NT$1,499/月", credits: "80 點/月", brands: "2 品牌" },
    { id: "business", name: "💎 專業版", price: "NT$1,999/月", credits: "250 點/月", brands: "5 品牌" },
  ];

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/users");
      if (res.status === 403) {
        router.push("/dashboard");
        return;
      }
      const data = await res.json();
      setUsers(data.users || []);
    } catch {
      console.error("Failed to fetch users");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchUsers();
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => { setCurrentUserId(d.userId || ""); setCurrentUserRole(d.role || "admin"); })
      .catch(() => {});
  }, [fetchUsers]);

  const openCreateModal = () => {
    setEditUser(null);
    setForm({ email: "", password: "", name: "", role: "subscriber" });
    setError("");
    setShowModal(true);
  };

  const openEditModal = (u: User) => {
    setEditUser(u);
    setForm({ email: u.email, password: "", name: u.name, role: u.role });
    setError("");
    setShowModal(true);
  };

  const handleSubmit = async () => {
    setError("");
    setSaving(true);
    try {
      if (editUser) {
        // Update
        const body: Record<string, string> = {};
        if (form.name !== editUser.name) body.name = form.name;
        if (form.role !== editUser.role) body.role = form.role;
        if (form.password) body.password = form.password;

        const res = await fetch(`/api/users/${editUser.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error);
          return;
        }
      } else {
        // Create
        const res = await fetch("/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error);
          return;
        }
      }
      setShowModal(false);
      fetchUsers();
    } catch {
      setError("操作失敗，請重試");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (u: User) => {
    if (!confirm(`確定要刪除 ${u.email} 嗎？此操作無法復原。`)) return;
    try {
      const res = await fetch(`/api/users/${u.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error);
        return;
      }
      fetchUsers();
    } catch {
      alert("刪除失敗");
    }
  };

  const handleAssignPlan = async () => {
    if (!planModal || !selectedPlan) return;
    setPlanSaving(true);
    setPlanError("");
    try {
      const res = await fetch("/api/credits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "assign_plan", userId: planModal.id, planId: selectedPlan }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPlanError(data.error);
        return;
      }
      setPlanModal(null);
      fetchUsers();
    } catch {
      setPlanError("操作失敗");
    } finally {
      setPlanSaving(false);
    }
  };

  const handleAdjust = async () => {
    if (!adjustModal || !adjustAmount) return;
    setPlanSaving(true);
    setPlanError("");
    try {
      const res = await fetch("/api/credits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "adjust",
          userId: adjustModal.id,
          amount: parseInt(adjustAmount),
          description: adjustDesc || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPlanError(data.error);
        return;
      }
      setAdjustModal(null);
      setAdjustAmount("");
      setAdjustDesc("");
    } catch {
      setPlanError("操作失敗");
    } finally {
      setPlanSaving(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">👥 帳號管理</h1>
          <p className="text-gray-500 text-sm mt-1">管理系統使用者帳號與權限</p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          新增帳號
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: "管理員", emoji: "👑", count: users.filter((u) => u.role === "admin").length, color: "text-red-400" },
          { label: "Master", emoji: "🛡️", count: users.filter((u) => u.role === "master").length, color: "text-purple-400" },
          { label: "編輯", emoji: "✏️", count: users.filter((u) => u.role === "editor").length, color: "text-blue-400" },
          { label: "訂閱會員", emoji: "⭐", count: users.filter((u) => u.role === "subscriber").length, color: "text-amber-400" },
        ].map((s) => (
          <div key={s.label} className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
            <p className={`text-2xl font-bold ${s.color}`}>{s.count}</p>
            <p className="text-gray-500 text-xs mt-1">{s.emoji} {s.label}</p>
          </div>
        ))}
      </div>

      {/* User List */}
      {loading ? (
        <div className="text-center py-16 text-gray-500">載入中...</div>
      ) : (
        <div className="space-y-3">
          {users.map((u) => (
            <div
              key={u.id}
              className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center justify-between hover:border-white/20 transition-colors"
            >
              {/* Left: Avatar + Info */}
              <div className="flex items-center gap-4 min-w-0 flex-1">
                <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center text-lg shrink-0">
                  {u.role === "admin" ? "👑" : u.role === "master" ? "🛡️" : u.role === "subscriber" ? "⭐" : "✏️"}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-white font-medium">{u.name || "—"}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border ${ROLE_MAP[u.role]?.cls || ROLE_MAP.editor.cls}`}>
                      {ROLE_MAP[u.role]?.label || u.role}
                    </span>
                    {u.id === currentUserId && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 border border-green-500/20">
                        本人
                      </span>
                    )}
                  </div>
                  <p className="text-gray-500 text-sm truncate">{u.email}</p>
                </div>
              </div>

              {/* Middle: Stats (desktop only) */}
              <div className="hidden md:flex items-center gap-6 px-4 shrink-0">
                <div className="text-right">
                  <p className="text-[10px] text-gray-600">上線時間</p>
                  <p className="text-sm text-gray-400">{formatTimeAgo(u.lastLoginAt)}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-gray-600">本月 Token</p>
                  <p className="text-sm text-gray-400">
                    {u.monthlyTokens?.totalTokens > 0 ? (
                      <>
                        <span className="text-white font-medium">{formatTokens(u.monthlyTokens.totalTokens)}</span>
                        <span className="text-gray-600 text-xs ml-1">
                          ({formatTokens(u.monthlyTokens.inputTokens)}↑ {formatTokens(u.monthlyTokens.outputTokens)}↓)
                        </span>
                      </>
                    ) : (
                      <span className="text-gray-600">—</span>
                    )}
                  </p>
                </div>
              </div>

              {/* Right: Actions */}
              <div className="flex items-center gap-2 shrink-0">
                {u.role === "subscriber" && (
                  <>
                    <button
                      onClick={() => { setPlanModal(u); setSelectedPlan(""); setPlanError(""); }}
                      className="px-3 py-1.5 text-xs bg-amber-900/30 text-amber-400 rounded-lg hover:bg-amber-900/50 transition-colors"
                    >
                      指派方案
                    </button>
                    <button
                      onClick={() => { setAdjustModal(u); setAdjustAmount(""); setAdjustDesc(""); setPlanError(""); }}
                      className="px-3 py-1.5 text-xs bg-green-900/30 text-green-400 rounded-lg hover:bg-green-900/50 transition-colors"
                    >
                      調整點數
                    </button>
                  </>
                )}
                <button
                  onClick={() => openEditModal(u)}
                  className="px-3 py-1.5 text-xs bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  編輯
                </button>
                {u.id !== currentUserId && (
                  <button
                    onClick={() => handleDelete(u)}
                    className="px-3 py-1.5 text-xs bg-red-900/30 text-red-400 rounded-lg hover:bg-red-900/50 transition-colors"
                  >
                    刪除
                  </button>
                )}
              </div>
            </div>
          ))}

          {users.length === 0 && (
            <div className="text-center py-16 text-gray-500">
              <p className="text-4xl mb-3">👥</p>
              <p>尚無帳號</p>
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-white/10 rounded-2xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold text-white mb-4">
              {editUser ? "編輯帳號" : "新增帳號"}
            </h2>

            {error && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                {error}
              </div>
            )}

            <div className="space-y-4">
              {/* Email */}
              <div>
                <label className="block text-sm text-gray-400 mb-1.5">Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  disabled={!!editUser}
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 text-sm"
                  placeholder="user@example.com"
                />
              </div>

              {/* Name */}
              <div>
                <label className="block text-sm text-gray-400 mb-1.5">姓名</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  placeholder="顯示名稱"
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm text-gray-400 mb-1.5">
                  {editUser ? "密碼（留空則不修改）" : "密碼"}
                </label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  placeholder={editUser ? "••••••••" : "至少 6 碼"}
                />
              </div>

              {/* Role */}
              <div>
                <label className="block text-sm text-gray-400 mb-1.5">角色</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(currentUserRole === "admin"
                    ? [
                        { value: "admin", label: "👑 管理員", desc: "完整權限" },
                        { value: "master", label: "🛡️ Master", desc: "管理訂閱會員" },
                        { value: "editor", label: "✏️ 編輯", desc: "內部團隊" },
                        { value: "subscriber", label: "⭐ 訂閱會員", desc: "僅限自己" },
                      ]
                    : [
                        { value: "subscriber", label: "⭐ 訂閱會員", desc: "僅限自己" },
                      ]
                  ).map((r) => (
                    <button
                      key={r.value}
                      type="button"
                      onClick={() => setForm({ ...form, role: r.value })}
                      className={`p-3 rounded-xl border text-center transition-all ${
                        form.role === r.value
                          ? "border-blue-500 bg-blue-500/10 text-white"
                          : "border-white/10 bg-white/5 text-gray-400 hover:border-white/20"
                      }`}
                    >
                      <p className="text-sm font-medium">{r.label}</p>
                      <p className="text-[10px] mt-0.5 text-gray-500">{r.desc}</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 py-2.5 bg-gray-800 text-gray-300 rounded-xl text-sm hover:bg-gray-700 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleSubmit}
                disabled={saving}
                className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {saving ? "處理中..." : editUser ? "儲存變更" : "建立帳號"}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Plan Assignment Modal */}
      {planModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-white/10 rounded-2xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold text-white mb-2">指派訂閱方案</h2>
            <p className="text-gray-400 text-sm mb-4">{planModal.name} ({planModal.email})</p>

            {planError && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                {planError}
              </div>
            )}

            <div className="space-y-3 mb-6">
              {PLANS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setSelectedPlan(p.id)}
                  className={`w-full p-4 rounded-xl border text-left transition-all ${
                    selectedPlan === p.id
                      ? "border-blue-500 bg-blue-500/10"
                      : "border-white/10 bg-white/5 hover:border-white/20"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-white font-medium">{p.name}</span>
                    <span className="text-gray-400 text-sm">{p.price}</span>
                  </div>
                  <p className="text-gray-500 text-xs mt-1">{p.credits} · {p.brands}</p>
                </button>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setPlanModal(null)}
                className="flex-1 py-2.5 bg-gray-800 text-gray-300 rounded-xl text-sm hover:bg-gray-700 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleAssignPlan}
                disabled={!selectedPlan || planSaving}
                className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {planSaving ? "處理中..." : "確認指派"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Credit Adjust Modal */}
      {adjustModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-white/10 rounded-2xl w-full max-w-sm p-6">
            <h2 className="text-lg font-bold text-white mb-2">調整點數</h2>
            <p className="text-gray-400 text-sm mb-4">{adjustModal.name} ({adjustModal.email})</p>

            {planError && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                {planError}
              </div>
            )}

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm text-gray-400 mb-1.5">調整數量（正數=加點、負數=扣點）</label>
                <input
                  type="number"
                  value={adjustAmount}
                  onChange={(e) => setAdjustAmount(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  placeholder="例：10 或 -5"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1.5">備註（選填）</label>
                <input
                  type="text"
                  value={adjustDesc}
                  onChange={(e) => setAdjustDesc(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  placeholder="例：補償加點"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setAdjustModal(null)}
                className="flex-1 py-2.5 bg-gray-800 text-gray-300 rounded-xl text-sm hover:bg-gray-700 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleAdjust}
                disabled={!adjustAmount || planSaving}
                className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {planSaving ? "處理中..." : "確認調整"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
