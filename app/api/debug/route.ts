import { NextResponse } from "next/server";

export async function GET() {
  try {
    const { drizzle } = await import("drizzle-orm/postgres-js");
    const postgres = (await import("postgres")).default;
    const url = process.env.POSTGRES_URL || "not-set";
    const masked = url.replace(/\/\/([^:]+):([^@]+)@/, "//$1:***@");
    
    const client = postgres(url, { prepare: false });
    const result = await client`SELECT 1 as test`;
    await client.end();
    
    return NextResponse.json({ ok: true, url: masked, result });
  } catch (error: any) {
    const url = process.env.POSTGRES_URL || "not-set";
    const masked = url.replace(/\/\/([^:]+):([^@]+)@/, "//$1:***@");
    return NextResponse.json({ 
      ok: false, 
      url: masked,
      error: error.message,
      code: error.code,
    }, { status: 500 });
  }
}
