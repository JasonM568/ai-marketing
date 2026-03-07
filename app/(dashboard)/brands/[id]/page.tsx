"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Brand } from "@/lib/db/schema";

const TABS = [
  { id: "brandVoice", label: "品牌聲音", icon: "🎙️", desc: "品牌的語氣、風格和溝通方式" },
  { id: "icp", label: "目標受眾", icon: "🎯", desc: "理想客戶輪廓與受眾分析" },
  { id: "services", label: "產品服務", icon: "📦", desc: "品牌提供的產品與服務" },
  { id: "contentPillars", label: "內容策略", icon: "📐", desc: "內容分類與策略規劃" },
  { id: "pastHits", label: "高成效參考", icon: "🔥", desc: "過去表現良好的內容參考" },
  { id: "brandStory", label: "品牌故事", icon: "📖", desc: "品牌起源與核心理念" },
  { id: "files", label: "參考資料", icon: "📎", desc: "上傳品牌參考文件供 AI 使用" },
  { id: "social", label: "社群帳號", icon: "🔗", desc: "連結 Meta 平台帳號" },
  { id: "members", label: "團隊成員", icon: "👥", desc: "品牌成員與權限管理" },
] as const;

type TabId = (typeof TABS)[number]["id"];

interface BrandFileItem {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  createdAt: string;
}

interface BrandMember {
  id: string;
  brandId: string;
  userId: string;
  role: string;
  assignedBy: string;
  createdAt: string;
  userName: string;
  userEmail: string;
  userRole: string;
}

interface SelectableUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

const FILE_ICONS: Record<string, string> = {
  pdf: "📕", csv: "📊", docx: "📘", doc: "📘", txt: "📄",
};

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  active: { label: "營運中", cls: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
  draft: { label: "待補充", cls: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
  inactive: { label: "停用", cls: "bg-gray-500/10 text-gray-400 border-gray-500/20" },
};

const PLATFORM_LABELS: Record<string, string> = {
  ig: "📸 IG", fb: "👤 FB", threads: "🧵 Threads", line: "💬 LINE",
  youtube: "▶️ YT", reels: "🎬 Reels", ads: "📢 Ads", blog: "📝 Blog",
  edm: "✉️ EDM", tiktok: "🎵 TikTok",
};

export default function BrandDetailPage() {
  const params = useParams();
  const router = useRouter();
  const brandId = params.id as string;

  const [brand, setBrand] = useState<Brand | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabId>("brandVoice");
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [userRole, setUserRole] = useState<string>("editor");
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const statusDropdownRef = useRef<HTMLDivElement>(null);
  const [files, setFiles] = useState<BrandFileItem[]>([]);
  const [filesLoading, setFilesLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [members, setMembers] = useState<BrandMember[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [availableUsers, setAvailableUsers] = useState<SelectableUser[]>([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedMemberRole, setSelectedMemberRole] = useState("member");
  const [addingMember, setAddingMember] = useState(false);

  const fetchBrand = useCallback(async () => {
    try {
      const res = await fetch(`/api/brands/${brandId}`);
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setBrand(data.brand);
    } catch {
      console.error("Failed to fetch brand");
    } finally {
      setLoading(false);
    }
  }, [brandId]);

  useEffect(() => {
    fetch("/api/auth/me").then(r => r.json()).then(d => setUserRole(d.role || "editor")).catch(() => {});
  }, []);

  useEffect(() => {
    fetchBrand();
  }, [fetchBrand]);

  const fetchFiles = useCallback(async () => {
    setFilesLoading(true);
    try {
      const res = await fetch(`/api/brands/${brandId}/files`);
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setFiles(data.files);
    } catch {
      console.error("Failed to fetch files");
    } finally {
      setFilesLoading(false);
    }
  }, [brandId]);

  useEffect(() => {
    if (activeTab === "files") {
      fetchFiles();
    }
  }, [activeTab, fetchFiles]);

  const fetchMembers = useCallback(async () => {
    setMembersLoading(true);
    try {
      const res = await fetch(`/api/brands/${brandId}/members`);
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setMembers(data.members || []);
    } catch {
      console.error("Failed to fetch members");
    } finally {
      setMembersLoading(false);
    }
  }, [brandId]);

  useEffect(() => {
    if (activeTab === "members") {
      fetchMembers();
    }
  }, [activeTab, fetchMembers]);

  const handleOpenAddMember = async () => {
    setShowAddMember(true);
    setSelectedUserId("");
    setSelectedMemberRole("member");
    try {
      const res = await fetch("/api/users");
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      const users = (data.users || []).filter(
        (u: SelectableUser) => (u.role === "editor" || u.role === "master") && !members.some((m) => m.userId === u.id)
      );
      setAvailableUsers(users);
    } catch {
      setAvailableUsers([]);
    }
  };

  const handleAddMember = async () => {
    if (!selectedUserId) return;
    setAddingMember(true);
    try {
      const res = await fetch(`/api/brands/${brandId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: selectedUserId, role: selectedMemberRole }),
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "新增失敗");
        return;
      }
      setShowAddMember(false);
      fetchMembers();
    } catch {
      alert("新增成員失敗");
    } finally {
      setAddingMember(false);
    }
  };

  const handleRemoveMember = async (userId: string, userName: string) => {
    if (!confirm(`確定要移除成員 ${userName} 嗎？`)) return;
    try {
      const res = await fetch(`/api/brands/${brandId}/members`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "移除失敗");
        return;
      }
      setMembers((prev) => prev.filter((m) => m.userId !== userId));
    } catch {
      alert("移除成員失敗");
    }
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(event.target as Node)) {
        setStatusDropdownOpen(false);
      }
    }
    if (statusDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [statusDropdownOpen]);

  const visibleTabs = TABS.filter((tab) => {
    if (tab.id === "members" && userRole === "subscriber") return false;
    return true;
  });

  const currentTab = TABS.find((t) => t.id === activeTab)!;
  const currentContent = brand ? ((brand as any)[activeTab] as string) || "" : "";

  const handleStartEdit = () => {
    setEditContent(currentContent);
    setEditing(true);
  };

  const handleSave = async () => {
    if (!brand) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/brands/${brand.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [activeTab]: editContent }),
      });
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setBrand(data.brand);
      setEditing(false);
    } catch {
      alert("儲存失敗，請重試");
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!brand || newStatus === brand.status) {
      setStatusDropdownOpen(false);
      return;
    }
    setStatusUpdating(true);
    try {
      const res = await fetch(`/api/brands/${brand.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setBrand(data.brand);
    } catch {
      alert("狀態更新失敗，請重試");
    } finally {
      setStatusUpdating(false);
      setStatusDropdownOpen(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadError("");
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch(`/api/brands/${brandId}/files`, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "上傳失敗");
      }
      await fetchFiles();
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "上傳失敗");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleFileDelete = async (fileId: string, fileName: string) => {
    if (!confirm(`確定要刪除 ${fileName} 嗎？`)) return;
    try {
      const res = await fetch(`/api/brands/${brandId}/files/${fileId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed");
      setFiles((prev) => prev.filter((f) => f.id !== fileId));
    } catch {
      alert("刪除檔案失敗");
    }
  };

  const handleDelete = async () => {
    if (!brand || deleteConfirm !== brand.name) return;
    try {
      const res = await fetch(`/api/brands/${brand.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
      router.push("/brands");
    } catch {
      alert("刪除失敗");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!brand) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500 mb-4">找不到該品牌</p>
        <Link href="/brands" className="text-blue-400 hover:underline text-sm">返回品牌列表</Link>
      </div>
    );
  }

  const st = STATUS_MAP[brand.status] || STATUS_MAP.draft;
  const platforms = (brand.platforms as string[]) || [];

  return (
    <div>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link href="/brands" className="hover:text-gray-300 transition-colors">品牌管理</Link>
        <span>›</span>
        <span className="text-gray-300">{brand.name}</span>
      </div>

      {/* Header Card */}
      <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-5 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-blue-600/15 border border-blue-500/20 flex items-center justify-center text-2xl font-bold text-blue-400 shrink-0">
            {brand.name.charAt(0)}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold text-white">{brand.name}</h1>
              <div className="relative" ref={statusDropdownRef}>
                <button
                  onClick={() => setStatusDropdownOpen(!statusDropdownOpen)}
                  disabled={statusUpdating}
                  className={`px-2 py-0.5 text-[10px] font-medium rounded-full border cursor-pointer hover:opacity-80 transition-opacity ${st.cls} ${statusUpdating ? "opacity-50" : ""}`}
                >
                  {statusUpdating ? "更新中..." : st.label}
                </button>
                {statusDropdownOpen && (
                  <div className="absolute top-full left-0 mt-1 bg-gray-900 border border-white/10 rounded-xl shadow-xl z-50 py-1 min-w-[100px]">
                    {Object.entries(STATUS_MAP).map(([key, val]) => (
                      <button
                        key={key}
                        onClick={() => handleStatusChange(key)}
                        className={`w-full px-3 py-1.5 text-left text-xs flex items-center gap-2 hover:bg-white/5 transition-colors ${
                          brand.status === key ? "text-white" : "text-gray-400"
                        }`}
                      >
                        <span className={`w-2 h-2 rounded-full ${
                          key === "active" ? "bg-emerald-400" :
                          key === "draft" ? "bg-amber-400" : "bg-gray-400"
                        }`} />
                        {val.label}
                        {brand.status === key && <span className="ml-auto text-blue-400">✓</span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
              <span className="font-mono text-xs">@{brand.brandCode}</span>
              {brand.industry && <><span>·</span><span>{brand.industry}</span></>}
            </div>
            {platforms.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {platforms.map((p) => (
                  <span key={p} className="px-2 py-0.5 bg-white/5 rounded text-[11px] text-gray-500">
                    {PLATFORM_LABELS[p] || p}
                  </span>
                ))}
              </div>
            )}
          </div>
          {userRole === "admin" && (
            <button
              onClick={() => setShowDelete(true)}
              className="shrink-0 p-2 text-gray-600 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all"
              title="刪除品牌"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 overflow-x-auto pb-1">
        {visibleTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              if (editing && !confirm("有未儲存的變更，確定切換嗎？")) return;
              setEditing(false);
              setActiveTab(tab.id);
            }}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${activeTab === tab.id
              ? "bg-blue-600/15 text-blue-400 border border-blue-500/25"
              : "text-gray-500 hover:text-gray-300 hover:bg-white/5 border border-transparent"
              }`}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/[0.06]">
          <div>
            <h2 className="font-semibold text-white text-sm flex items-center gap-2">
              <span>{currentTab.icon}</span> {currentTab.label}
            </h2>
            <p className="text-[11px] text-gray-600 mt-0.5">{currentTab.desc}</p>
          </div>
          {activeTab !== "files" && activeTab !== "members" && (
            !editing ? (
              <button
                onClick={handleStartEdit}
                className="px-3 py-1.5 bg-blue-600/10 text-blue-400 text-xs font-medium rounded-lg hover:bg-blue-600/20 transition-colors"
              >
                編輯
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button onClick={() => setEditing(false)} className="px-3 py-1.5 text-gray-500 text-xs hover:text-gray-300">
                  取消
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? "儲存中..." : "儲存"}
                </button>
              </div>
            )
          )}
        </div>

        <div className="p-5">
          {activeTab === "members" ? (
            <div>
              {/* Add Member Button for admin/master */}
              {(userRole === "admin" || userRole === "master") && (
                <div className="flex justify-end mb-4">
                  <button
                    onClick={handleOpenAddMember}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-xs font-medium rounded-xl hover:bg-blue-700 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    新增成員
                  </button>
                </div>
              )}

              {/* Members List */}
              {membersLoading ? (
                <div className="text-center py-8">
                  <div className="w-6 h-6 border-2 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto" />
                </div>
              ) : members.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-4xl mb-3">👥</p>
                  <p className="text-gray-600 text-sm">此品牌尚未指派團隊成員</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {members.map((m) => {
                    const memberRoleBadge = m.role === "manager"
                      ? { label: "管理者", cls: "bg-purple-500/10 text-purple-400 border-purple-500/20" }
                      : { label: "成員", cls: "bg-blue-500/10 text-blue-400 border-blue-500/20" };
                    const userRoleBadge = m.userRole === "master"
                      ? { label: "Master", cls: "bg-purple-500/10 text-purple-400 border-purple-500/20" }
                      : { label: "編輯", cls: "bg-gray-500/10 text-gray-400 border-gray-500/20" };
                    return (
                      <div
                        key={m.id}
                        className="flex items-center justify-between px-4 py-3 bg-white/[0.02] border border-white/[0.06] rounded-xl hover:border-white/[0.12] transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gray-800 flex items-center justify-center text-sm">
                            {m.userRole === "master" ? "🛡️" : "✏️"}
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm text-white font-medium">{m.userName || "—"}</span>
                              <span className={`text-[10px] px-2 py-0.5 rounded-full border ${memberRoleBadge.cls}`}>
                                {memberRoleBadge.label}
                              </span>
                              <span className={`text-[10px] px-2 py-0.5 rounded-full border ${userRoleBadge.cls}`}>
                                {userRoleBadge.label}
                              </span>
                            </div>
                            <p className="text-gray-500 text-xs mt-0.5">{m.userEmail}</p>
                          </div>
                        </div>
                        {(userRole === "admin" || userRole === "master") && (
                          <button
                            onClick={() => handleRemoveMember(m.userId, m.userName || m.userEmail)}
                            className="px-3 py-1.5 text-xs bg-red-900/30 text-red-400 rounded-lg hover:bg-red-900/50 transition-colors"
                          >
                            移除
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Add Member Modal */}
              {showAddMember && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                  <div className="absolute inset-0 bg-black/70" onClick={() => setShowAddMember(false)} />
                  <div className="relative w-full max-w-md bg-gray-900 border border-white/10 rounded-2xl p-6">
                    <h3 className="text-lg font-semibold text-white mb-4">新增品牌成員</h3>

                    {/* User Selection */}
                    <div className="mb-4">
                      <label className="block text-sm text-gray-400 mb-1.5">選擇用戶</label>
                      {availableUsers.length === 0 ? (
                        <p className="text-gray-600 text-sm py-4 text-center">沒有可指派的用戶（僅限 editor / master）</p>
                      ) : (
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {availableUsers.map((u) => (
                            <button
                              key={u.id}
                              onClick={() => setSelectedUserId(u.id)}
                              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all ${
                                selectedUserId === u.id
                                  ? "border border-blue-500 bg-blue-500/10"
                                  : "border border-white/[0.06] bg-white/[0.02] hover:border-white/[0.12]"
                              }`}
                            >
                              <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center text-sm">
                                {u.role === "master" ? "🛡️" : "✏️"}
                              </div>
                              <div>
                                <p className="text-sm text-white">{u.name || u.email}</p>
                                <p className="text-[10px] text-gray-500">{u.email} · {u.role === "master" ? "Master" : "編輯"}</p>
                              </div>
                              {selectedUserId === u.id && <span className="ml-auto text-blue-400">✓</span>}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Role Selection */}
                    <div className="mb-6">
                      <label className="block text-sm text-gray-400 mb-1.5">成員角色</label>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { value: "manager", label: "管理者", desc: "品牌管理權限" },
                          { value: "member", label: "成員", desc: "一般成員" },
                        ].map((r) => (
                          <button
                            key={r.value}
                            type="button"
                            onClick={() => setSelectedMemberRole(r.value)}
                            className={`p-3 rounded-xl border text-center transition-all ${
                              selectedMemberRole === r.value
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

                    {/* Actions */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => setShowAddMember(false)}
                        className="flex-1 py-2 bg-white/5 text-gray-400 rounded-xl hover:bg-white/10 text-sm"
                      >
                        取消
                      </button>
                      <button
                        onClick={handleAddMember}
                        disabled={!selectedUserId || addingMember}
                        className="flex-1 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-30 disabled:cursor-not-allowed text-sm font-medium"
                      >
                        {addingMember ? "新增中..." : "確認新增"}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : activeTab === "social" ? (
            <div className="text-center py-8">
              <p className="text-4xl mb-3">🔗</p>
              <p className="text-gray-400 mb-4">管理此品牌的社群帳號連結（Facebook、Instagram、Threads）</p>
              <a
                href={`/brands/${brandId}/social`}
                className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-colors font-medium"
              >
                前往社群帳號管理 →
              </a>
            </div>
          ) : activeTab === "files" ? (
            <div>
              {/* Upload Area */}
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-white/10 rounded-xl cursor-pointer hover:border-blue-500/30 hover:bg-blue-600/5 transition-all">
                <div className="text-center">
                  <p className="text-2xl mb-1">📎</p>
                  <p className="text-sm text-gray-400">
                    {uploading ? "上傳中..." : "點擊上傳檔案"}
                  </p>
                  <p className="text-[10px] text-gray-600 mt-1">
                    支援 PDF, DOCX, DOC, CSV, TXT（最大 10MB）
                  </p>
                </div>
                <input
                  type="file"
                  className="hidden"
                  accept=".pdf,.docx,.doc,.csv,.txt"
                  onChange={handleFileUpload}
                  disabled={uploading}
                />
              </label>

              {uploadError && (
                <p className="text-red-400 text-xs mt-2">{uploadError}</p>
              )}

              {/* File List */}
              <div className="mt-4 space-y-2">
                {filesLoading ? (
                  <div className="text-center py-8">
                    <div className="w-6 h-6 border-2 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto" />
                  </div>
                ) : files.length === 0 ? (
                  <p className="text-center text-gray-600 py-8 text-sm">
                    尚未上傳參考資料
                  </p>
                ) : (
                  files.map((f) => (
                    <div
                      key={f.id}
                      className="flex items-center justify-between px-4 py-3 bg-white/[0.02] border border-white/[0.06] rounded-xl"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-lg">{FILE_ICONS[f.fileType] || "📄"}</span>
                        <div>
                          <p className="text-sm text-white">{f.fileName}</p>
                          <p className="text-[10px] text-gray-600">
                            {(f.fileSize / 1024).toFixed(1)} KB · {new Date(f.createdAt).toLocaleDateString("zh-TW")}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleFileDelete(f.id, f.fileName)}
                        className="p-1.5 text-gray-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                        title="刪除檔案"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : editing ? (
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              placeholder={`使用 Markdown 格式編輯 ${currentTab.label}...\n\n## 標題\n- 項目一\n- 項目二`}
              className="w-full min-h-[400px] p-4 bg-white/[0.03] border border-white/10 rounded-xl text-white/80 placeholder:text-gray-700 font-mono text-sm leading-relaxed resize-y focus:outline-none focus:border-blue-500/30"
              spellCheck={false}
            />
          ) : currentContent ? (
            <div className="prose prose-invert prose-sm max-w-none prose-headings:text-white prose-p:text-gray-400 prose-li:text-gray-400 prose-strong:text-gray-200 prose-code:text-blue-300">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{currentContent}</ReactMarkdown>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-600 mb-3 text-sm">尚未填寫{currentTab.label}</p>
              <button
                onClick={handleStartEdit}
                className="px-3 py-1.5 bg-white/5 text-gray-400 rounded-lg hover:bg-white/10 text-xs"
              >
                開始編輯
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Delete Modal */}
      {showDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70" onClick={() => setShowDelete(false)} />
          <div className="relative w-full max-w-sm bg-gray-900 border border-white/10 rounded-2xl p-6">
            <div className="text-center mb-4">
              <div className="text-3xl mb-2">⚠️</div>
              <h3 className="text-lg font-semibold text-white">確定要刪除品牌嗎？</h3>
              <p className="text-sm text-gray-500 mt-1">
                請輸入 <strong className="text-white">{brand.name}</strong> 以確認
              </p>
            </div>
            <input
              type="text"
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value)}
              placeholder={brand.name}
              className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-gray-700 focus:outline-none focus:border-red-500/50 mb-4 text-sm"
            />
            <div className="flex gap-2">
              <button
                onClick={() => { setShowDelete(false); setDeleteConfirm(""); }}
                className="flex-1 py-2 bg-white/5 text-gray-400 rounded-xl hover:bg-white/10 text-sm"
              >
                取消
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteConfirm !== brand.name}
                className="flex-1 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 disabled:opacity-30 disabled:cursor-not-allowed text-sm font-medium"
              >
                確認刪除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
