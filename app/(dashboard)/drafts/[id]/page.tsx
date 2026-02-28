"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface DraftDetail {
  id: string;
  brandId: string | null;
  agentId: string | null;
  conversationId: string | null;
  platform: string | null;
  topic: string | null;
  content: string;
  status: string;
  metadata: unknown;
  createdAt: string;
  updatedAt: string;
  brandName: string | null;
  brandCode: string | null;
  agentName: string | null;
  agentIcon: string | null;
  agentRole: string | null;
}

const statusOptions = [
  { value: "draft", label: "草稿", color: "bg-yellow-900/50 text-yellow-400" },
  { value: "reviewed", label: "已審核", color: "bg-blue-900/50 text-blue-400" },
  { value: "published", label: "已發布", color: "bg-green-900/50 text-green-400" },
];

export default function DraftDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [draft, setDraft] = useState<DraftDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState("");
  const [editTopic, setEditTopic] = useState("");
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [viewMode, setViewMode] = useState<"preview" | "raw">("preview");

  useEffect(() => {
    if (params.id) fetchDraft(params.id as string);
  }, [params.id]);

  async function fetchDraft(id: string) {
    try {
      const res = await fetch(`/api/drafts/${id}`, { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setDraft(data);
        setEditContent(data.content);
        setEditTopic(data.topic || "");
      } else {
        router.push("/drafts");
      }
    } catch (err) {
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  }

  async function saveDraft() {
    if (!draft) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/drafts/${draft.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          content: editContent,
          topic: editTopic,
        }),
      });
      if (res.ok) {
        setDraft({ ...draft, content: editContent, topic: editTopic });
        setEditing(false);
      }
    } catch (err) {
      console.error("Save error:", err);
    } finally {
      setSaving(false);
    }
  }

  async function updateStatus(newStatus: string) {
    if (!draft) return;
    try {
      const res = await fetch(`/api/drafts/${draft.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setDraft({ ...draft, status: newStatus });
      }
    } catch (err) {
      console.error("Status update error:", err);
    }
  }

  async function deleteDraft() {
    if (!draft || !confirm("確定要刪除這份草稿嗎？")) return;
    try {
      const res = await fetch(`/api/drafts/${draft.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (res.ok) {
        router.push("/drafts");
      }
    } catch (err) {
      console.error("Delete error:", err);
    }
  }

  async function copyContent() {
    if (!draft) return;
    await navigator.clipboard.writeText(draft.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function exportFile(format: "markdown" | "text") {
    if (!draft) return;
    const content =
      format === "markdown"
        ? `# ${draft.topic || "未命名草稿"}\n\n${draft.content}`
        : (draft.content || "").replace(/[#*_`~\[\]()>-]/g, "");

    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${draft.topic || "draft"}.${format === "markdown" ? "md" : "txt"}`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400">載入中...</div>
      </div>
    );
  }

  if (!draft) return null;

  const currentStatus = statusOptions.find((s) => s.value === draft.status) || statusOptions[0];

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="text-sm text-gray-500">
        <button onClick={() => router.push("/drafts")} className="hover:text-gray-300">
          草稿庫
        </button>
        <span className="mx-2">›</span>
        <span className="text-gray-300">{draft.topic || "未命名草稿"}</span>
      </nav>

      {/* Header */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <div className="flex items-start justify-between">
          <div>
            {editing ? (
              <input
                value={editTopic}
                onChange={(e) => setEditTopic(e.target.value)}
                className="text-xl font-bold text-white bg-gray-800 border border-gray-700 rounded-lg px-3 py-1 focus:outline-none focus:border-blue-500 w-full max-w-md"
                placeholder="草稿標題"
              />
            ) : (
              <h1 className="text-xl font-bold text-white">
                {draft.topic || "未命名草稿"}
              </h1>
            )}
            <div className="flex items-center gap-3 mt-2 text-sm text-gray-400">
              {draft.agentIcon && <span>{draft.agentIcon}</span>}
              <span>{draft.agentName || "未知代理"}</span>
              <span className="text-gray-700">·</span>
              <span>{draft.brandName || "未知品牌"}</span>
              {draft.platform && (
                <>
                  <span className="text-gray-700">·</span>
                  <span className="px-1.5 py-0.5 text-xs rounded bg-gray-800">
                    {draft.platform.toUpperCase()}
                  </span>
                </>
              )}
              <span className="text-gray-700">·</span>
              <span className="text-gray-500">
                {new Date(draft.createdAt).toLocaleDateString("zh-TW", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
          </div>

          {/* Status Selector */}
          <div className="flex items-center gap-2">
            <select
              value={draft.status}
              onChange={(e) => updateStatus(e.target.value)}
              className={`px-3 py-1.5 text-xs rounded-full border-0 focus:outline-none cursor-pointer ${currentStatus.color}`}
            >
              {statusOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex flex-wrap gap-2">
        {editing ? (
          <>
            <button
              onClick={saveDraft}
              disabled={saving}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-lg text-sm transition-colors"
            >
              {saving ? "儲存中..." : "💾 儲存"}
            </button>
            <button
              onClick={() => {
                setEditing(false);
                setEditContent(draft.content);
                setEditTopic(draft.topic || "");
              }}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-sm transition-colors"
            >
              取消
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => setEditing(true)}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-sm transition-colors"
            >
              ✏️ 編輯
            </button>
            <button
              onClick={copyContent}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-sm transition-colors"
            >
              {copied ? "✅ 已複製" : "📋 複製"}
            </button>
            <button
              onClick={() => exportFile("markdown")}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-sm transition-colors"
            >
              📥 Markdown
            </button>
            <button
              onClick={() => exportFile("text")}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-sm transition-colors"
            >
              📥 純文字
            </button>
            <button
              onClick={deleteDraft}
              className="px-4 py-2 bg-red-900/20 hover:bg-red-900/30 text-red-400 rounded-lg text-sm transition-colors ml-auto"
            >
              🗑 刪除
            </button>
          </>
        )}

        {!editing && (
          <div className="flex gap-1 ml-auto border border-gray-800 rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode("preview")}
              className={`px-3 py-1.5 text-xs transition-colors ${
                viewMode === "preview"
                  ? "bg-gray-700 text-white"
                  : "text-gray-500 hover:text-gray-300"
              }`}
            >
              預覽
            </button>
            <button
              onClick={() => setViewMode("raw")}
              className={`px-3 py-1.5 text-xs transition-colors ${
                viewMode === "raw"
                  ? "bg-gray-700 text-white"
                  : "text-gray-500 hover:text-gray-300"
              }`}
            >
              原始
            </button>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        {editing ? (
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            className="w-full min-h-[400px] bg-gray-950 border border-gray-800 rounded-lg p-4 text-gray-300 text-sm font-mono focus:outline-none focus:border-blue-500 resize-y"
          />
        ) : viewMode === "preview" ? (
          <div className="prose prose-invert prose-sm max-w-none">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{draft.content}</ReactMarkdown>
          </div>
        ) : (
          <pre className="text-gray-300 text-sm whitespace-pre-wrap font-mono">
            {draft.content}
          </pre>
        )}
      </div>
    </div>
  );
}
