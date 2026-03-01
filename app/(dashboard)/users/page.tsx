"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  createdAt: string;
}

const ROLE_MAP: Record<string, { label: string; cls: string }> = {
  admin: { label: "管理員", cls: "bg-red-500/10 text-red-400 border-red-500/20" },
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
      .then((d) => setCurrentUserId(d.userId || ""))
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
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: "管理員", count: users.filter((u) => u.role === "admin").length, color: "text-red-400" },
          { label: "編輯", count: users.filter((u) => u.role === "editor").length, color: "text-blue-400" },
          { label: "訂閱會員", count: users.filter((u) => u.role === "subscriber").length, color: "text-amber-400" },
        ].map((s) => (
          <div key={s.label} className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
            <p className={`text-2xl font-bold ${s.color}`}>{s.count}</p>
            <p className="text-gray-500 text-xs mt-1">{s.label}</p>
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
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center text-lg">
                  {u.role === "admin" ? "👑" : u.role === "subscriber" ? "⭐" : "✏️"}
                </div>
                <div>
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
                  <p className="text-gray-500 text-sm">{u.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
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
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: "admin", label: "👑 管理員", desc: "完整權限" },
                    { value: "editor", label: "✏️ 編輯", desc: "內部團隊" },
                    { value: "subscriber", label: "⭐ 訂閱會員", desc: "僅限自己" },
                  ].map((r) => (
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
    </div>
  );
}
