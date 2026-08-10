import { readdir, readFile } from "node:fs/promises";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { Pool } from "pg";
import { splitSql } from "../../market/scripts/sql-splitter.mjs";

const databaseUrl = process.env.DIRECT_URL || process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL Service belum diatur.");
const migrationsDir = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "db", "migrations");
const files = (await readdir(migrationsDir)).filter((name) => name.endsWith(".sql")).sort();
const exec = promisify(execFile);
// Service memakai Tenant/Outlet/User yang sama sebagai platform baseline.
// Jalankan baseline Market pada database yang sama sebelum schema Service.
await exec(process.execPath, [
  path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "market", "scripts", "ensure-market-schema.mjs"),
], { env: process.env });
const pool = new Pool({ connectionString: databaseUrl });

if (files.length === 0) throw new Error("Tidak ada berkas migrasi Service.");

try {
  for (const file of files) {
    const content = await readFile(path.join(migrationsDir, file), "utf8");
    for (const statement of splitSql(content)) await pool.query(statement);
    console.log(`✓ ${file}`);
  }
  console.log(`Schema Service siap (${files.length} migrasi).`);
} finally {
  await pool.end();
}
