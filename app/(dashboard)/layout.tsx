"use client";

import { useEffect, useState } from "react";
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

  const allNavItems = [
    { href: "/dashboard", label: "工作總覽", icon: "📊", desc: "數據與快速指令" },
    { href: "/workspace", label: "工作台", icon: "✨", desc: "AI 內容產出" },
    { href: "/brands", label: "品牌管理", icon: "🏷️", desc: "品牌資料庫" },
    { href: "/agents", label: "AI 代理", icon: "🤖", desc: "代理管理" },
    { href: "/drafts", label: "草稿庫", icon: "📄", desc: "產出記錄" },
    { href: "/my-plan", label: "我的方案", icon: "💳", desc: "點數與用量", subscriberOnly: true },
    { href: "/users", label: "帳號管理", icon: "👥", desc: "用戶與權限", adminOnly: true },
  ];

  // Filter nav items by role
  const navItems = allNavItems.filter((item) => {
    if ("adminOnly" in item && item.adminOnly && session?.role !== "admin") return false;
    if ("subscriberOnly" in item && item.subscriberOnly && session?.role !== "subscriber") return false;
    if (item.href === "/agents" && session?.role === "subscriber") return false;
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
        <span className="font-bold text-sm">🤖 AI Marketing Agent(v1.4)</span>
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
        className={`fixed top-0 left-0 h-full w-64 bg-gray-900 border-r border-white/10 z-50 transform transition-transform duration-200 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"
          } lg:translate-x-0`}
      >
        {/* Logo */}
        <div className="p-5 border-b border-white/10">
          <Link href="/workspace" className="flex items-center gap-2">
            <span className="text-2xl">🤖</span>
            <div>
              <p className="font-bold text-white text-sm">AI Marketing Agent</p>
              <p className="text-[10px] text-gray-500">惠邦行銷 · 內容產出系統 v1.4</p>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="p-3 space-y-1">
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
        <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-white/10">
          <div className="flex items-center justify-between px-3 py-2">
            <div>
              <p className="text-sm text-gray-300">{session?.email?.split("@")[0]}</p>
              <p className="text-[10px] text-gray-600">{session?.role === "admin" ? "管理員" : session?.role === "subscriber" ? "訂閱會員" : "編輯"}</p>
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
