import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sql } from "drizzle-orm";

export async function GET() {
  try {
    const result = await db.execute(sql`SELECT 1 as test`);
    return NextResponse.json({ ok: true, result });
  } catch (error: any) {
    return NextResponse.json({ 
      ok: false, 
      error: error.message,
      code: error.code,
    }, { status: 500 });
  }
}
