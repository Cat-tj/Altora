/**
 * ensure-service-schema.mjs
 *
 * Standalone Service migration runner. Depends only on shared/platform data
 * (Tenant, Outlet, User) already existing on the target database.
 * This script does NOT call or depend on ensure-market-schema.mjs.
 *
 * Usage:
 *   DATABASE_URL=postgresql://... node scripts/ensure-service-schema.mjs
 */
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { Pool } from "pg";
import { splitSql } from "../../../scripts/sql-splitter.mjs";

const databaseUrl = process.env.DIRECT_URL || process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL Service belum diatur.");

const migrationsDir = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "db",
  "migrations",
);

const files = (await readdir(migrationsDir))
  .filter((name) => name.endsWith(".sql"))
  .sort();

if (files.length === 0) throw new Error("Tidak ada berkas migrasi Service.");

const pool = new Pool({ connectionString: databaseUrl });

try {
  for (const file of files) {
    const content = await readFile(path.join(migrationsDir, file), "utf8");
    for (const statement of splitSql(content)) {
      await pool.query(statement);
    }
    console.log(`✓ ${file}`);
  }
  console.log(`Schema Service siap (${files.length} migrasi).`);
} finally {
  await pool.end();
}
