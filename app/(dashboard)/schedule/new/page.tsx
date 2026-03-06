"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Brand {
  id: string;
  name: string;
  brandCode: string;
}

interface SocialAccount {
  id: string;
  platform: string;
  platformUsername: string | null;
  status: string;
}

interface DraftItem {
  id: string;
  topic: string | null;
  content: string;
  platform: string | null;
  createdAt: string;
}

const platformIcons: Record<string, string> = {
  facebook: "👤",
  fb: "👤",
  instagram: "📸",
  ig: "📸",
  threads: "🧵",
};

export default function NewSchedulePage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Data
  const [brands, setBrands] = useState<Brand[]>([]);
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [drafts, setDrafts] = useState<DraftItem[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(false);
  const [loadingDrafts, setLoadingDrafts] = useState(false);

  // Form
  const [selectedBrand, setSelectedBrand] = useState("");
  const [content, setContent] = useState("");
  const [selectedDraftId, setSelectedDraftId] = useState<string | null>(null);
  // Multi-platform selection
  const [selectedAccounts, setSelectedAccounts] = useState<
    { accountId: string; platform: string; username: string }[]
  >([]);
  const [publishMode, setPublishMode] = useState<"schedule" | "now">("schedule");
  const [scheduledAt, setScheduledAt] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load brands
  useEffect(() => {
    fetch("/api/brands", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => {
        const list = d.brands || d || [];
        setBrands(Array.isArray(list) ? list : []);
      })
      .catch(console.error);
  }, []);

  // Load accounts when brand is selected
  useEffect(() => {
    if (!selectedBrand) {
      setAccounts([]);
      return;
    }
    setLoadingAccounts(true);
    fetch(`/api/social/accounts?brandId=${selectedBrand}`, { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        const list = Array.isArray(data) ? data : [];
        setAccounts(list.filter((a: SocialAccount) => a.status === "active"));
      })
      .catch(console.error)
      .finally(() => setLoadingAccounts(false));
  }, [selectedBrand]);

  // Load reviewed drafts when brand is selected
  useEffect(() => {
    if (!selectedBrand) {
      setDrafts([]);
      return;
    }
    setLoadingDrafts(true);
    fetch(`/api/drafts?status=reviewed&brandId=${selectedBrand}`, { credentials: "include" })
      .then((r) => r.json())
      .then((data) => setDrafts(Array.isArray(data) ? data : []))
      .catch(console.error)
      .finally(() => setLoadingDrafts(false));
  }, [selectedBrand]);

  function selectDraft(draft: DraftItem) {
    setContent(draft.content);
    setSelectedDraftId(draft.id);
  }

  // Toggle account selection (multi-select)
  function toggleAccount(account: SocialAccount) {
    setSelectedAccounts((prev) => {
      const exists = prev.find((a) => a.accountId === account.id);
      if (exists) {
        return prev.filter((a) => a.accountId !== account.id);
      }
      return [
        ...prev,
        {
          accountId: account.id,
          platform: account.platform,
          username: account.platformUsername || "已連結",
        },
      ];
    });
  }

  // Select all accounts
  function selectAllAccounts() {
    if (selectedAccounts.length === accounts.length) {
      setSelectedAccounts([]);
    } else {
      setSelectedAccounts(
        accounts.map((a) => ({
          accountId: a.id,
          platform: a.platform,
          username: a.platformUsername || "已連結",
        }))
      );
    }
  }

  function isAccountSelected(accountId: string) {
    return selectedAccounts.some((a) => a.accountId === accountId);
  }

  function getPlatformIcon(platform: string) {
    return platformIcons[platform.toLowerCase()] || "📱";
  }

  // Image upload handler
  const handleImageUpload = useCallback(async (file: File) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      setError("僅支援 JPG、PNG、WebP、GIF 圖片格式");
      return;
    }
    if (file.size > 4.5 * 1024 * 1024) {
      setError("圖片大小不能超過 4.5MB");
      return;
    }

    setUploading(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "圖片上傳失敗");
        return;
      }
      const { url } = await res.json();
      setImageUrl(url);
    } catch {
      setError("圖片上傳失敗，請重試");
    } finally {
      setUploading(false);
    }
  }, []);

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files[0];
    if (file) handleImageUpload(file);
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    setDragActive(true);
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault();
    setDragActive(false);
  }

  function canProceed() {
    switch (step) {
      case 1:
        return !!selectedBrand;
      case 2:
        return content.trim().length > 0;
      case 3:
        return selectedAccounts.length > 0;
      case 4:
        if (publishMode === "now") return true;
        return !!scheduledAt && new Date(scheduledAt) > new Date();
      default:
        return true;
    }
  }

  async function handleSubmit() {
    setError("");
    setSaving(true);
    try {
      const isNow = publishMode === "now";
      const apiUrl = isNow ? "/api/schedule/publish-now" : "/api/schedule";
      const results: { platform: string; success: boolean; error?: string }[] = [];

      for (const acc of selectedAccounts) {
        try {
          const payload: Record<string, unknown> = {
            brandId: selectedBrand,
            socialAccountId: acc.accountId,
            platform: acc.platform,
            content,
            imageUrl: imageUrl || null,
            draftId: selectedDraftId,
          };

          // Only include scheduledAt for scheduled posts
          if (!isNow) {
            payload.scheduledAt = new Date(scheduledAt).toISOString();
          }

          const res = await fetch(apiUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify(payload),
          });

          if (!res.ok) {
            const data = await res.json();
            results.push({ platform: acc.platform, success: false, error: data.error });
          } else {
            results.push({ platform: acc.platform, success: true });
          }
        } catch {
          results.push({ platform: acc.platform, success: false, error: "請求失敗" });
        }
      }

      const failed = results.filter((r) => !r.success);
      if (failed.length > 0 && failed.length === results.length) {
        const action = isNow ? "發布" : "排程";
        setError(`所有平台${action}失敗：${failed.map((f) => `${f.platform}(${f.error})`).join("、")}`);
        return;
      }

      const successParam = isNow ? "published" : "scheduled";
      if (failed.length > 0) {
        router.push(
          `/schedule?success=partial&failed=${failed.map((f) => f.platform).join(",")}`
        );
      } else {
        router.push(`/schedule?success=${successParam}`);
      }
    } catch {
      setError("操作失敗，請重試");
    } finally {
      setSaving(false);
    }
  }

  // Format datetime for display
  function formatDatetime(dt: string) {
    if (!dt) return "-";
    return new Date(dt).toLocaleString("zh-TW", {
      year: "numeric",
      month: "long",
      day: "numeric",
      weekday: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  // Minimum datetime (now + 1 minute) in local time format for datetime-local input
  function getMinDatetime() {
    const d = new Date(Date.now() + 60000);
    const pad = (n: number) => n.toString().padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }
  const minDatetime = getMinDatetime();

  return (
    <div className="max-w-2xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link href="/schedule" className="hover:text-gray-300 transition-colors">
          排程發文
        </Link>
        <span>›</span>
        <span className="text-gray-300">建立排程</span>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-2xl">
        <div className="px-6 py-5 border-b border-gray-800">
          <h1 className="text-xl font-bold text-white">建立排程</h1>
          <p className="text-sm text-gray-500 mt-1">設定排程將內容自動發布到社群平台</p>
        </div>

        {/* Steps indicator */}
        <div className="px-6 pt-4">
          <div className="flex items-center gap-2">
            {[
              { n: 1, label: "選擇品牌" },
              { n: 2, label: "撰寫內容" },
              { n: 3, label: "選擇平台" },
              { n: 4, label: "發布方式" },
              { n: 5, label: "確認送出" },
            ].map((s, i) => (
              <div key={s.n} className="flex items-center gap-2">
                {i > 0 && <div className="w-6 h-px bg-gray-700" />}
                <div
                  className={`flex items-center gap-1.5 text-xs ${
                    step === s.n
                      ? "text-blue-400"
                      : step > s.n
                      ? "text-green-400"
                      : "text-gray-600"
                  }`}
                >
                  <span
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      step === s.n
                        ? "bg-blue-600 text-white"
                        : step > s.n
                        ? "bg-green-600 text-white"
                        : "bg-gray-800 text-gray-500"
                    }`}
                  >
                    {step > s.n ? "✓" : s.n}
                  </span>
                  <span className="hidden sm:inline">{s.label}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-6 space-y-5">
          {error && (
            <div className="px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-400">
              {error}
            </div>
          )}

          {/* Step 1: Select Brand */}
          {step === 1 && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-3">
                選擇品牌 <span className="text-red-400">*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {brands.map((brand) => (
                  <button
                    key={brand.id}
                    type="button"
                    onClick={() => setSelectedBrand(brand.id)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      selectedBrand === brand.id
                        ? "bg-blue-600/10 border-blue-500/30 text-white"
                        : "bg-gray-950 border-gray-800 text-gray-400 hover:bg-gray-800"
                    }`}
                  >
                    <div className="font-medium text-sm">{brand.name}</div>
                    <div className="text-[11px] text-gray-600 mt-0.5">@{brand.brandCode}</div>
                  </button>
                ))}
              </div>
              {brands.length === 0 && (
                <p className="text-sm text-gray-500">
                  尚無品牌，請先<Link href="/brands/new" className="text-blue-400 hover:underline">建立品牌</Link>
                </p>
              )}
            </div>
          )}

          {/* Step 2: Content */}
          {step === 2 && (
            <div className="space-y-4">
              {/* Load from draft */}
              {drafts.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    從已審核草稿載入（可選）
                  </label>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {loadingDrafts ? (
                      <p className="text-sm text-gray-500">載入中...</p>
                    ) : (
                      drafts.map((draft) => (
                        <button
                          key={draft.id}
                          type="button"
                          onClick={() => selectDraft(draft)}
                          className={`w-full p-3 rounded-lg border text-left text-sm transition-all ${
                            selectedDraftId === draft.id
                              ? "bg-blue-600/10 border-blue-500/30 text-white"
                              : "bg-gray-950 border-gray-800 text-gray-400 hover:bg-gray-800"
                          }`}
                        >
                          <div className="font-medium">{draft.topic || "未命名草稿"}</div>
                          <div className="text-xs text-gray-600 mt-0.5 truncate">
                            {draft.content.slice(0, 60)}...
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  貼文內容 <span className="text-red-400">*</span>
                </label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="輸入要發布的內容..."
                  rows={6}
                  className="w-full px-4 py-3 bg-gray-950 border border-gray-800 rounded-xl text-white placeholder:text-gray-700 focus:outline-none focus:border-blue-500 transition-colors text-sm resize-y"
                />
                <p className="text-[11px] text-gray-600 mt-1">{content.length} 字</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  圖片（可選）
                </label>

                {imageUrl ? (
                  /* Image preview */
                  <div className="relative rounded-xl border border-gray-800 overflow-hidden bg-gray-950">
                    <img
                      src={imageUrl}
                      alt="預覽圖片"
                      className="w-full max-h-64 object-contain"
                    />
                    <button
                      type="button"
                      onClick={() => setImageUrl("")}
                      className="absolute top-2 right-2 w-7 h-7 bg-gray-900/80 hover:bg-red-600/80 text-gray-400 hover:text-white rounded-full flex items-center justify-center transition-colors text-sm"
                    >
                      ✕
                    </button>
                  </div>
                ) : uploading ? (
                  /* Upload progress */
                  <div className="flex flex-col items-center justify-center py-8 rounded-xl border-2 border-dashed border-blue-500/30 bg-blue-950/10">
                    <div className="w-6 h-6 border-2 border-blue-400/30 border-t-blue-400 rounded-full animate-spin mb-2" />
                    <p className="text-sm text-blue-400">上傳中...</p>
                  </div>
                ) : (
                  /* Drag & drop zone */
                  <div
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onClick={() => fileInputRef.current?.click()}
                    className={`flex flex-col items-center justify-center py-8 rounded-xl border-2 border-dashed cursor-pointer transition-colors ${
                      dragActive
                        ? "border-blue-500 bg-blue-950/20"
                        : "border-gray-700 hover:border-gray-600 bg-gray-950"
                    }`}
                  >
                    <span className="text-3xl mb-2">📷</span>
                    <p className="text-sm text-gray-400">
                      拖曳圖片到這裡，或<span className="text-blue-400">點擊選擇</span>
                    </p>
                    <p className="text-[11px] text-gray-600 mt-1">
                      支援 JPG、PNG、WebP、GIF（最大 4.5MB）
                    </p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleImageUpload(file);
                        e.target.value = "";
                      }}
                    />
                  </div>
                )}

                {/* URL fallback toggle */}
                {!imageUrl && !uploading && (
                  <div className="mt-2">
                    <button
                      type="button"
                      onClick={() => setShowUrlInput(!showUrlInput)}
                      className="text-[11px] text-gray-600 hover:text-gray-400 transition-colors"
                    >
                      {showUrlInput ? "收起" : "或貼上圖片網址 ›"}
                    </button>
                    {showUrlInput && (
                      <input
                        type="url"
                        value={imageUrl}
                        onChange={(e) => setImageUrl(e.target.value)}
                        placeholder="https://example.com/image.jpg"
                        className="w-full mt-1.5 px-4 py-2.5 bg-gray-950 border border-gray-800 rounded-xl text-white placeholder:text-gray-700 focus:outline-none focus:border-blue-500 transition-colors text-sm"
                      />
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 3: Select Platform/Account (Multi-select) */}
          {step === 3 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-medium text-gray-300">
                  選擇發布平台 <span className="text-red-400">*</span>
                  <span className="text-gray-600 font-normal ml-2">（可多選）</span>
                </label>
                {accounts.length > 1 && (
                  <button
                    type="button"
                    onClick={selectAllAccounts}
                    className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    {selectedAccounts.length === accounts.length ? "取消全選" : "全部選取"}
                  </button>
                )}
              </div>
              {loadingAccounts ? (
                <p className="text-sm text-gray-500">載入帳號中...</p>
              ) : accounts.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p className="text-3xl mb-2">🔗</p>
                  <p className="text-sm">此品牌尚未連結社群帳號</p>
                  <p className="text-xs mt-1">
                    請先到品牌設定頁面連結社群帳號
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-2">
                  {accounts.map((account) => (
                    <button
                      key={account.id}
                      type="button"
                      onClick={() => toggleAccount(account)}
                      className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                        isAccountSelected(account.id)
                          ? "bg-blue-600/10 border-blue-500/30 text-white"
                          : "bg-gray-950 border-gray-800 text-gray-400 hover:bg-gray-800"
                      }`}
                    >
                      {/* Checkbox indicator */}
                      <span
                        className={`w-5 h-5 rounded flex items-center justify-center text-xs border transition-colors ${
                          isAccountSelected(account.id)
                            ? "bg-blue-600 border-blue-500 text-white"
                            : "bg-gray-900 border-gray-700"
                        }`}
                      >
                        {isAccountSelected(account.id) && "✓"}
                      </span>
                      <span className="text-2xl">{getPlatformIcon(account.platform)}</span>
                      <div>
                        <div className="font-medium text-sm">
                          {account.platform.toUpperCase()}
                        </div>
                        <div className="text-xs text-gray-600">
                          {account.platformUsername || "已連結"}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
              {selectedAccounts.length > 0 && (
                <p className="text-xs text-blue-400 mt-3">
                  已選擇 {selectedAccounts.length} 個平台，將同時建立 {selectedAccounts.length} 筆排程
                </p>
              )}
            </div>
          )}

          {/* Step 4: Publish Mode & Schedule Time */}
          {step === 4 && (
            <div className="space-y-4">
              {/* Publish mode selection */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">
                  選擇發布方式
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setPublishMode("now")}
                    className={`p-4 rounded-xl border text-left transition-all ${
                      publishMode === "now"
                        ? "bg-green-600/10 border-green-500/30"
                        : "bg-gray-950 border-gray-800 hover:bg-gray-800"
                    }`}
                  >
                    <div className="text-2xl mb-1">🚀</div>
                    <div className={`font-medium text-sm ${publishMode === "now" ? "text-green-300" : "text-gray-300"}`}>
                      立即發布
                    </div>
                    <div className="text-[11px] text-gray-600 mt-0.5">
                      確認後馬上發送到平台
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPublishMode("schedule")}
                    className={`p-4 rounded-xl border text-left transition-all ${
                      publishMode === "schedule"
                        ? "bg-blue-600/10 border-blue-500/30"
                        : "bg-gray-950 border-gray-800 hover:bg-gray-800"
                    }`}
                  >
                    <div className="text-2xl mb-1">📅</div>
                    <div className={`font-medium text-sm ${publishMode === "schedule" ? "text-blue-300" : "text-gray-300"}`}>
                      排程發布
                    </div>
                    <div className="text-[11px] text-gray-600 mt-0.5">
                      設定時間自動發布
                    </div>
                  </button>
                </div>
              </div>

              {/* Immediate publish info */}
              {publishMode === "now" && (
                <div className="p-3 rounded-xl border bg-green-900/20 border-green-800/30 text-sm text-green-300">
                  🚀 將在確認後立即發布到{selectedAccounts.length > 1
                    ? ` ${selectedAccounts.length} 個平台`
                    : "所選平台"}
                </div>
              )}

              {/* Schedule time picker */}
              {publishMode === "schedule" && (
                <>
                  {/* Quick select */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      快速選擇
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {(() => {
                        const now = new Date();
                        const pad = (n: number) => n.toString().padStart(2, "0");
                        const toLocalStr = (d: Date) =>
                          `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;

                        const todayNoon = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0);
                        const today6pm = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 18, 0);
                        const today9pm = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 21, 0);
                        const tmr = new Date(now);
                        tmr.setDate(tmr.getDate() + 1);
                        const tmr9am = new Date(tmr.getFullYear(), tmr.getMonth(), tmr.getDate(), 9, 0);
                        const tmrNoon = new Date(tmr.getFullYear(), tmr.getMonth(), tmr.getDate(), 12, 0);
                        const tmr6pm = new Date(tmr.getFullYear(), tmr.getMonth(), tmr.getDate(), 18, 0);

                        const options: { label: string; value: Date }[] = [];
                        if (todayNoon > now) options.push({ label: "今天中午 12:00", value: todayNoon });
                        if (today6pm > now) options.push({ label: "今天傍晚 18:00", value: today6pm });
                        if (today9pm > now) options.push({ label: "今天晚上 21:00", value: today9pm });
                        options.push({ label: "明天早上 09:00", value: tmr9am });
                        options.push({ label: "明天中午 12:00", value: tmrNoon });
                        options.push({ label: "明天傍晚 18:00", value: tmr6pm });

                        return options.slice(0, 6).map((opt) => (
                          <button
                            key={opt.label}
                            type="button"
                            onClick={() => setScheduledAt(toLocalStr(opt.value))}
                            className={`p-2.5 rounded-xl border text-left text-sm transition-all ${
                              scheduledAt === toLocalStr(opt.value)
                                ? "bg-blue-600/10 border-blue-500/30 text-blue-300"
                                : "bg-gray-950 border-gray-800 text-gray-400 hover:bg-gray-800 hover:text-gray-300"
                            }`}
                          >
                            {opt.label}
                          </button>
                        ));
                      })()}
                    </div>
                  </div>

                  {/* Custom datetime picker */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      或自訂日期時間
                    </label>
                    <input
                      type="datetime-local"
                      value={scheduledAt}
                      onChange={(e) => setScheduledAt(e.target.value)}
                      min={minDatetime}
                      className="w-full px-4 py-3 bg-gray-950 border border-gray-800 rounded-xl text-white focus:outline-none focus:border-blue-500 transition-colors text-sm [color-scheme:dark]"
                    />
                  </div>

                  {/* Selected time preview */}
                  {scheduledAt && (
                    <div className={`p-3 rounded-xl border text-sm ${
                      new Date(scheduledAt) <= new Date()
                        ? "bg-red-900/20 border-red-800/30 text-red-400"
                        : "bg-blue-900/20 border-blue-800/30 text-blue-300"
                    }`}>
                      {new Date(scheduledAt) <= new Date() ? (
                        <span>⚠️ 所選時間已過，請選擇未來的時間</span>
                      ) : (
                        <span>
                          📅 將在{" "}
                          <strong>{formatDatetime(scheduledAt)}</strong>
                          {" "}自動發布
                          {selectedAccounts.length > 1 && (
                            <span className="text-blue-400/70">
                              {" "}（{selectedAccounts.length} 個平台同步發布）
                            </span>
                          )}
                        </span>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Step 5: Preview & Submit */}
          {step === 5 && (
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-300">
                {publishMode === "now" ? "確認發布資訊" : "確認排程資訊"}
              </h3>
              <div className="bg-gray-950 border border-gray-800 rounded-xl p-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">品牌</span>
                  <span className="text-white">
                    {brands.find((b) => b.id === selectedBrand)?.name || "-"}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">發布方式</span>
                  <span className={publishMode === "now" ? "text-green-400" : "text-blue-400"}>
                    {publishMode === "now" ? "🚀 立即發布" : "📅 排程發布"}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">發布平台</span>
                  <div className="text-right">
                    {selectedAccounts.map((acc) => (
                      <div key={acc.accountId} className="text-white">
                        {getPlatformIcon(acc.platform)} {acc.platform.toUpperCase()}
                        <span className="text-gray-600 text-xs ml-1">({acc.username})</span>
                      </div>
                    ))}
                  </div>
                </div>
                {publishMode === "schedule" && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">排程時間</span>
                    <span className="text-white">{formatDatetime(scheduledAt)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">
                    {publishMode === "now" ? "發布數量" : "排程數量"}
                  </span>
                  <span className={publishMode === "now" ? "text-green-400" : "text-blue-400"}>
                    {selectedAccounts.length} 個平台
                  </span>
                </div>
                {imageUrl && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">圖片</span>
                      <span className="text-green-400 text-xs">✅ 已附圖</span>
                    </div>
                    <img
                      src={imageUrl}
                      alt="附圖預覽"
                      className="w-full max-h-48 object-contain rounded-lg border border-gray-800"
                    />
                  </div>
                )}
                <div className="border-t border-gray-800 pt-3">
                  <span className="text-gray-500 text-sm">內容預覽</span>
                  <p className="text-gray-300 text-sm mt-1 whitespace-pre-wrap">
                    {content.slice(0, 300)}
                    {content.length > 300 && "..."}
                  </p>
                </div>
              </div>

              {/* Warning for immediate publish */}
              {publishMode === "now" && (
                <div className="p-3 rounded-xl border bg-yellow-900/20 border-yellow-800/30 text-sm text-yellow-300">
                  ⚠️ 確認後將<strong>立即</strong>發送到所選平台，此操作無法撤回
                </div>
              )}
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center gap-3 pt-4 border-t border-gray-800">
            {step > 1 && (
              <button
                type="button"
                onClick={() => setStep(step - 1)}
                className="px-4 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm rounded-xl transition-colors"
              >
                上一步
              </button>
            )}

            {step < 5 ? (
              <button
                type="button"
                onClick={() => setStep(step + 1)}
                disabled={!canProceed()}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                下一步
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={saving}
                className={`px-5 py-2.5 text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-50 ${
                  publishMode === "now"
                    ? "bg-green-600 hover:bg-green-500"
                    : "bg-blue-600 hover:bg-blue-500"
                }`}
              >
                {saving
                  ? publishMode === "now" ? "發布中..." : "排程中..."
                  : publishMode === "now"
                  ? `🚀 確認立即發布（${selectedAccounts.length} 個平台）`
                  : `📅 確認排程發布（${selectedAccounts.length} 個平台）`}
              </button>
            )}

            <Link
              href="/schedule"
              className="px-4 py-2.5 text-gray-500 hover:text-gray-300 transition-colors text-sm ml-auto"
            >
              取消
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
