"use client";

import Link from "next/link";

const productLinks = [
  { label: "功能介紹", href: "#features" },
  { label: "方案價格", href: "#pricing" },
  { label: "常見問題", href: "#faq" },
];

const legalLinks = [
  { label: "服務條款", href: "/terms" },
  { label: "隱私權政策", href: "/privacy" },
  { label: "資料刪除說明", href: "/data-deletion" },
];

export default function Footer() {
  return (
    <footer className="bg-gray-950 border-t border-white/5 pt-16 pb-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          {/* Brand */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl">🤖</span>
              <span className="text-lg font-bold text-white">
                AI Marketing Agent
              </span>
            </div>
            <p className="text-sm text-gray-500 leading-relaxed">
              惠邦行銷 AI 內容產出系統
              <br />
              讓 AI 助你提升行銷效率
            </p>
          </div>

          {/* Product */}
          <div>
            <h4 className="text-sm font-semibold text-gray-300 mb-4">產品</h4>
            <ul className="space-y-2.5">
              {productLinks.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="text-sm text-gray-500 hover:text-white transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-sm font-semibold text-gray-300 mb-4">法律</h4>
            <ul className="space-y-2.5">
              {legalLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-gray-500 hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-sm font-semibold text-gray-300 mb-4">聯絡我們</h4>
            <ul className="space-y-2.5">
              <li className="text-sm text-gray-500">
                📧 support@huibang.com.tw
              </li>
              <li className="text-sm text-gray-500">
                🌐 ai-marketing.huibang.com.tw
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/5 pt-6 text-center">
          <p className="text-xs text-gray-600">
            © 2026 惠邦行銷有限公司. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
