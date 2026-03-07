import postgres from "postgres";

const url = process.env.POSTGRES_URL;
if (!url) {
  console.error("POSTGRES_URL not set");
  process.exit(1);
}

const sql = postgres(url);

async function run() {
  await sql`
    CREATE TABLE IF NOT EXISTS brand_members (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      brand_id uuid NOT NULL,
      user_id uuid NOT NULL,
      role varchar(20) NOT NULL DEFAULT 'member',
      assigned_by uuid,
      created_at timestamp DEFAULT now() NOT NULL
    )
  `;
  await sql`
    CREATE UNIQUE INDEX IF NOT EXISTS brand_members_brand_user_unique
    ON brand_members (brand_id, user_id)
  `;
  console.log("✅ brand_members table created with unique index!");
  await sql.end();
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
