"use client";

import { useState, useEffect } from "react";
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
  const [selectedAccount, setSelectedAccount] = useState("");
  const [selectedPlatform, setSelectedPlatform] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [imageUrl, setImageUrl] = useState("");

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

  function selectAccount(account: SocialAccount) {
    setSelectedAccount(account.id);
    setSelectedPlatform(account.platform);
  }

  function getPlatformIcon(platform: string) {
    return platformIcons[platform.toLowerCase()] || "📱";
  }

  function canProceed() {
    switch (step) {
      case 1:
        return !!selectedBrand;
      case 2:
        return content.trim().length > 0;
      case 3:
        return !!selectedAccount;
      case 4:
        return !!scheduledAt && new Date(scheduledAt) > new Date();
      default:
        return true;
    }
  }

  async function handleSubmit() {
    setError("");
    setSaving(true);
    try {
      // Convert local datetime to proper ISO string with timezone
      // datetime-local gives "2026-03-07T04:00", new Date() in browser uses local TZ
      const scheduledDate = new Date(scheduledAt);

      const res = await fetch("/api/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          brandId: selectedBrand,
          socialAccountId: selectedAccount,
          platform: selectedPlatform,
          content,
          imageUrl: imageUrl || null,
          scheduledAt: scheduledDate.toISOString(), // Send UTC ISO string
          draftId: selectedDraftId,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "建立排程失敗");
        return;
      }

      router.push("/schedule?success=scheduled");
    } catch {
      setError("建立排程失敗，請重試");
    } finally {
      setSaving(false);
    }
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
              { n: 4, label: "排程時間" },
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
                  圖片網址（可選）
                </label>
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://example.com/image.jpg"
                  className="w-full px-4 py-2.5 bg-gray-950 border border-gray-800 rounded-xl text-white placeholder:text-gray-700 focus:outline-none focus:border-blue-500 transition-colors text-sm"
                />
              </div>
            </div>
          )}

          {/* Step 3: Select Platform/Account */}
          {step === 3 && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-3">
                選擇發布平台 <span className="text-red-400">*</span>
              </label>
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
                      onClick={() => selectAccount(account)}
                      className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                        selectedAccount === account.id
                          ? "bg-blue-600/10 border-blue-500/30 text-white"
                          : "bg-gray-950 border-gray-800 text-gray-400 hover:bg-gray-800"
                      }`}
                    >
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
            </div>
          )}

          {/* Step 4: Schedule Time */}
          {step === 4 && (
            <div className="space-y-4">
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

                    // Today shortcuts (only show if time hasn't passed)
                    const todayNoon = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0);
                    const today6pm = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 18, 0);
                    const today9pm = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 21, 0);
                    // Tomorrow shortcuts
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

              {/* Custom date/time */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  或自訂日期時間
                </label>
                <div className="flex gap-2">
                  <input
                    type="date"
                    value={scheduledAt ? scheduledAt.split("T")[0] : ""}
                    onChange={(e) => {
                      const time = scheduledAt ? scheduledAt.split("T")[1] || "09:00" : "09:00";
                      setScheduledAt(`${e.target.value}T${time}`);
                    }}
                    min={new Date().toISOString().split("T")[0]}
                    className="flex-1 px-4 py-2.5 bg-gray-950 border border-gray-800 rounded-xl text-white focus:outline-none focus:border-blue-500 transition-colors text-sm"
                  />
                  <select
                    value={scheduledAt ? scheduledAt.split("T")[1]?.slice(0, 5) || "09:00" : "09:00"}
                    onChange={(e) => {
                      const date = scheduledAt ? scheduledAt.split("T")[0] : new Date().toISOString().split("T")[0];
                      setScheduledAt(`${date}T${e.target.value}`);
                    }}
                    className="w-28 px-3 py-2.5 bg-gray-950 border border-gray-800 rounded-xl text-white focus:outline-none focus:border-blue-500 transition-colors text-sm"
                  >
                    {Array.from({ length: 48 }, (_, i) => {
                      const h = Math.floor(i / 2);
                      const m = i % 2 === 0 ? "00" : "30";
                      const val = `${h.toString().padStart(2, "0")}:${m}`;
                      const label = `${h.toString().padStart(2, "0")}:${m}`;
                      return (
                        <option key={val} value={val}>
                          {label}
                        </option>
                      );
                    })}
                  </select>
                </div>
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
                      <strong>
                        {new Date(scheduledAt).toLocaleString("zh-TW", {
                          month: "long",
                          day: "numeric",
                          weekday: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </strong>
                      {" "}自動發布
                    </span>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Step 5: Preview & Submit */}
          {step === 5 && (
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-300">確認排程資訊</h3>
              <div className="bg-gray-950 border border-gray-800 rounded-xl p-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">品牌</span>
                  <span className="text-white">
                    {brands.find((b) => b.id === selectedBrand)?.name || "-"}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">平台</span>
                  <span className="text-white">
                    {getPlatformIcon(selectedPlatform)} {selectedPlatform.toUpperCase()}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">帳號</span>
                  <span className="text-white">
                    {accounts.find((a) => a.id === selectedAccount)?.platformUsername || "-"}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">排程時間</span>
                  <span className="text-white">
                    {scheduledAt
                      ? new Date(scheduledAt).toLocaleString("zh-TW", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "-"}
                  </span>
                </div>
                {imageUrl && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">圖片</span>
                    <span className="text-blue-400 truncate max-w-[200px]">{imageUrl}</span>
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
                className="px-5 py-2.5 bg-green-600 hover:bg-green-500 text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-50"
              >
                {saving ? "排程中..." : "✅ 確認排程發布"}
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
