"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";

interface Session {
  userId: string;
  email: string;
  role: string;
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [session, setSession] = useState<Session | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => {
        if (res.status === 401) {
          router.push("/login");
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (data && !data.error) {
          setSession(data);
          setReady(true);
        }
      })
      .catch(() => router.push("/login"));
  }, [router]);

  // ===== Session polling: detect single-device kick =====
  useEffect(() => {
    if (!ready) return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch("/api/auth/me");
        if (res.status === 401) {
          const data = await res.json().catch(() => ({}));
          if (data.error === "session_invalid") {
            alert("您的帳號已在其他裝置登入，即將返回登入頁面");
          }
          clearInterval(interval);
          router.push("/login");
        }
      } catch {
        // network error — skip this cycle
      }
    }, 60_000);
    return () => clearInterval(interval);
  }, [ready, router]);

  // ===== Inactivity auto-logout (30 minutes) =====
  const inactivityTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const throttleRef = useRef(false);

  const IDLE_TIMEOUT = 30 * 60 * 1000; // 30 minutes

  const resetIdleTimer = useCallback(() => {
    if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
    inactivityTimer.current = setTimeout(async () => {
      await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
      router.push("/login");
    }, IDLE_TIMEOUT);
  }, [router]);

  useEffect(() => {
    if (!ready) return;

    const handleActivity = () => {
      if (throttleRef.current) return;
      throttleRef.current = true;
      resetIdleTimer();
      setTimeout(() => { throttleRef.current = false; }, 5_000);
    };

    const events = ["mousemove", "keydown", "click", "scroll", "touchstart"] as const;
    events.forEach((e) => window.addEventListener(e, handleActivity));
    resetIdleTimer(); // start timer on mount

    return () => {
      events.forEach((e) => window.removeEventListener(e, handleActivity));
      if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
    };
  }, [ready, resetIdleTimer]);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  if (!ready) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-400/30 border-t-blue-400 rounded-full animate-spin" />
      </div>
    );
  }

  const ROLE_LABELS: Record<string, { emoji: string; label: string }> = {
    admin: { emoji: "👑", label: "管理員" },
    master: { emoji: "🛡️", label: "Master 管理者" },
    editor: { emoji: "✏️", label: "編輯" },
    subscriber: { emoji: "⭐", label: "訂閱會員" },
  };

  const allNavItems: {
    href: string; label: string; icon: string; desc: string; roles?: string[];
  }[] = [
    { href: "/dashboard", label: "工作總覽", icon: "📊", desc: "數據與快速指令" },
    { href: "/brands", label: "品牌管理", icon: "🏷️", desc: "品牌資料庫" },
    { href: "/workspace", label: "工作區", icon: "✨", desc: "AI 內容產出" },
    { href: "/agents", label: "AI 助理", icon: "🤖", desc: "代理管理", roles: ["admin", "master"] },
    { href: "/drafts", label: "草稿材料庫", icon: "📄", desc: "產出記錄" },
    { href: "/schedule", label: "排程發文", icon: "📅", desc: "排程管理" },
    { href: "/comments", label: "留言回覆", icon: "💬", desc: "AI 留言管理" },
    { href: "/pricing", label: "方案價格", icon: "💰", desc: "訂閱方案" },
    { href: "/my-plan", label: "我的方案", icon: "💳", desc: "點數與用量", roles: ["subscriber"] },
    { href: "/billing", label: "帳單紀錄", icon: "🧾", desc: "付款記錄", roles: ["subscriber"] },
    { href: "/users", label: "帳號管理", icon: "👥", desc: "用戶與權限", roles: ["admin", "master"] },
  ];

  // Filter nav items by role — admin sees everything
  const navItems = allNavItems.filter((item) => {
    if (session?.role === "admin") return true;
    if (item.roles) return item.roles.includes(session?.role || "");
    return true;
  });

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Mobile header */}
      <div className="lg:hidden bg-gray-900 border-b border-white/10 px-4 py-3 flex items-center justify-between">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="text-gray-400 hover:text-white"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <span className="font-bold text-sm">🤖 AI Marketing Agent(v1.7)</span>
        <div className="w-6" />
      </div>

      {/* Overlay */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/60 z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-gray-900 border-r border-white/10 z-50 flex flex-col transform transition-transform duration-200 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"
          } lg:translate-x-0`}
      >
        {/* Logo */}
        <div className="p-5 border-b border-white/10">
          <Link href="/dashboard" className="flex items-center gap-2">
            <span className="text-2xl">🤖</span>
            <div>
              <p className="font-bold text-white text-sm">AI Marketing Agent</p>
              <p className="text-[10px] text-gray-500">惠邦行銷 · 內容產出系統 v1.7</p>
            </div>
          </Link>
        </div>

        {/* Navigation — scrollable for growing menu */}
        <nav className="p-3 space-y-1 overflow-y-auto flex-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors ${isActive
                  ? "bg-blue-600/20 text-blue-400"
                  : "text-gray-400 hover:bg-white/5 hover:text-gray-200"
                  }`}
              >
                <span className="text-lg">{item.icon}</span>
                <div>
                  <p className="font-medium">{item.label}</p>
                  <p className="text-[10px] opacity-60">{item.desc}</p>
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Bottom */}
        <div className="mt-auto p-3 border-t border-white/10">
          <div className="flex items-center justify-between px-3 py-2">
            <div>
              <p className="text-sm text-gray-300">{session?.email?.split("@")[0]}</p>
              <p className="text-[10px] text-gray-600">{ROLE_LABELS[session?.role || ""]?.emoji} {ROLE_LABELS[session?.role || ""]?.label || session?.role}</p>
            </div>
            <button
              onClick={handleLogout}
              className="text-xs text-gray-500 hover:text-red-400 transition-colors"
            >
              登出
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="lg:ml-64 min-h-screen">
        <div className="p-4 sm:p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
