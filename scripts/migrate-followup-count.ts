/**
 * Migration: Add followup_count column to conversations table
 * Run: npx tsx scripts/migrate-followup-count.ts
 */
import { readFileSync } from "fs";
import { resolve } from "path";
import postgres from "postgres";

// Load .env.local manually
function loadEnv() {
  try {
    const envPath = resolve(process.cwd(), ".env.local");
    const content = readFileSync(envPath, "utf-8");
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIndex = trimmed.indexOf("=");
      if (eqIndex === -1) continue;
      const key = trimmed.slice(0, eqIndex).trim();
      let value = trimmed.slice(eqIndex + 1).trim();
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      if (!process.env[key]) process.env[key] = value;
    }
  } catch {
    // .env.local not found, rely on existing env vars
  }
}

loadEnv();

const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("POSTGRES_URL or DATABASE_URL is not set");
}

const sql = postgres(connectionString);

async function migrate() {
  console.log("Adding followup_count column to conversations...");

  await sql`
    ALTER TABLE conversations
    ADD COLUMN IF NOT EXISTS followup_count INTEGER NOT NULL DEFAULT 0
  `;

  console.log("Done! followup_count column added.");
  await sql.end();
}

migrate().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
