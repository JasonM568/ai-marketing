import { NextResponse } from "next/server";

// Threads deauthorize callback — Meta 會在用戶取消授權時呼叫
export async function POST() {
  // TODO: 未來可在此清除該用戶的 Threads token
  console.log("[Threads] Deauthorize callback received");
  return NextResponse.json({ success: true });
}

export async function GET() {
  return NextResponse.json({ success: true });
}
