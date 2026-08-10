import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { Pool } from "pg";
import { splitSql } from "./sql-splitter.mjs";

const databaseUrl = process.env.DIRECT_URL || process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL / DIRECT_URL Market belum diatur.");

const migrationsDir = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "db",
  "migrations"
);

const files = (await readdir(migrationsDir))
  .filter((name) => name.endsWith(".sql"))
  .sort();

if (files.length === 0)
  throw new Error("Tidak ada berkas migrasi di db/migrations.");

const pool = new Pool({
  connectionString: databaseUrl,
  ssl:
    databaseUrl.includes("supabase") || databaseUrl.includes("pooler")
      ? { rejectUnauthorized: false }
      : undefined,
});

try {
  for (const file of files) {
    const content = await readFile(path.join(migrationsDir, file), "utf8");
    const statements = splitSql(content);

    for (let idx = 0; idx < statements.length; idx++) {
      try {
        await pool.query(statements[idx]);
      } catch (err) {
        console.error(
          `Error in ${file}, statement ${idx + 1}: ${err instanceof Error ? err.message : err}`
        );
        process.exit(1);
      }
    }
    console.log("✓ " + file);
  }
  console.log("Schema Market siap (" + files.length + " migrasi).");
} finally {
  await pool.end();
}
