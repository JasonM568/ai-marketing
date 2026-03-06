"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

const navLinks = [
  { label: "功能", href: "#features" },
  { label: "流程", href: "#how-it-works" },
  { label: "方案", href: "#pricing" },
  { label: "常見問題", href: "#faq" },
];

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile menu on resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) setIsMobileOpen(false);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-gray-950/95 backdrop-blur-lg border-b border-white/5 shadow-lg"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo */}
          <a href="#" className="flex items-center gap-2">
            <span className="text-xl">🤖</span>
            <span className="text-base lg:text-lg font-bold text-white">
              AI Marketing Agent
            </span>
          </a>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm text-gray-400 hover:text-white transition-colors"
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              href="/login"
              className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
            >
              登入
            </Link>
            <Link
              href="/login"
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-xl transition-all hover:scale-105"
            >
              免費開始使用
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setIsMobileOpen(!isMobileOpen)}
            className="md:hidden p-2 text-gray-400 hover:text-white transition-colors"
            aria-label="Toggle menu"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              {isMobileOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {isMobileOpen && (
        <div className="md:hidden bg-gray-950/98 backdrop-blur-lg border-b border-white/5">
          <div className="px-4 py-4 space-y-1">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setIsMobileOpen(false)}
                className="block px-4 py-3 text-sm text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
              >
                {link.label}
              </a>
            ))}
            <div className="pt-3 mt-3 border-t border-white/5 space-y-2">
              <Link
                href="/login"
                onClick={() => setIsMobileOpen(false)}
                className="block px-4 py-3 text-sm text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
              >
                登入
              </Link>
              <Link
                href="/login"
                onClick={() => setIsMobileOpen(false)}
                className="block px-4 py-3 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-xl text-center transition-all"
              >
                免費開始使用
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
