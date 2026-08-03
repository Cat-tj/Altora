import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { Pool } from "pg";

/**
 * Menjalankan migrasi Market secara berurutan.
 *
 * Setiap berkas ditulis idempoten (CREATE ... IF NOT EXISTS), jadi menjalankan
 * ulang perintah ini aman dan belum butuh tabel pencatat migrasi. Ini cukup
 * selama schema hanya bertambah; begitu ada migrasi yang mengubah atau
 * menghapus kolom, pencatatan versi menjadi wajib.
 */
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL Market belum diatur.");

const migrationsDir = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "db", "migrations");
const files = (await readdir(migrationsDir)).filter((name) => name.endsWith(".sql")).sort();

if (files.length === 0) throw new Error("Tidak ada berkas migrasi di db/migrations.");

const pool = new Pool({
  connectionString: databaseUrl,
  ssl: databaseUrl.includes("supabase") || databaseUrl.includes("pooler") ? { rejectUnauthorized: false } : undefined,
});

try {
  for (const file of files) {
    await pool.query(await readFile(path.join(migrationsDir, file), "utf8"));
    console.log(`✓ ${file}`);
  }
  console.log(`Schema Market siap (${files.length} migrasi).`);
} finally {
  await pool.end();
}
