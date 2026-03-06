import { NextResponse } from "next/server";

// Threads data deletion callback — Meta 會在用戶要求刪除資料時呼叫
export async function POST() {
  // TODO: 未來可在此刪除該用戶的 Threads 相關資料
  console.log("[Threads] Data deletion callback received");

  // Meta 要求回傳確認碼和狀態查詢 URL
  return NextResponse.json({
    url: "https://ai-marketing.huibang.com.tw/api/social/threads/delete",
    confirmation_code: `del_${Date.now()}`,
  });
}

export async function GET() {
  return NextResponse.json({ success: true });
}
