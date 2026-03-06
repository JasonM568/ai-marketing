import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Marketing Agent | 惠邦行銷",
  description: "AI 行銷內容產出系統",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-TW">
      <body className="antialiased">{children}</body>
    </html>
  );
}
