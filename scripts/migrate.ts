import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { Client } from "pg";

dotenv.config();

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL is required");
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const migrationsDir = path.resolve(__dirname, "..", "migrations");

const client = new Client({ connectionString: databaseUrl });

async function ensureMigrationsTable() {
  await client.query(`
    create table if not exists migrations (
      id text primary key,
      applied_at timestamptz not null default now()
    )
  `);
}

async function getApplied() {
  const res = await client.query<{ id: string }>("select id from migrations");
  return new Set(res.rows.map((r) => r.id));
}

async function run() {
  await client.connect();
  try {
    await ensureMigrationsTable();
    const applied = await getApplied();

    if (!fs.existsSync(migrationsDir)) {
      throw new Error(`Migrations directory not found: ${migrationsDir}`);
    }

    const files = fs
      .readdirSync(migrationsDir)
      .filter((f) => f.endsWith(".sql"))
      .sort((a, b) => a.localeCompare(b));

    for (const file of files) {
      if (applied.has(file)) continue;
      const sql = fs.readFileSync(path.join(migrationsDir, file), "utf-8");
      await client.query("begin");
      try {
        await client.query(sql);
        await client.query("insert into migrations (id) values ($1)", [file]);
        await client.query("commit");
        console.log(`applied ${file}`);
      } catch (e) {
        await client.query("rollback");
        throw e;
      }
    }
  } finally {
    await client.end();
  }
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
