import { Pool } from "pg";

declare global {
  var altoraDbPool: Pool | undefined;
}

function createPool(): Pool {
  const value = process.env.DATABASE_URL;
  if (!value) throw new Error("DATABASE_URL belum diatur.");

  const pool = new Pool({
    connectionString: value,
    ssl:
      value.includes("supabase") || value.includes("pooler")
        ? { rejectUnauthorized: false }
        : undefined,
  });

  if (process.env.NODE_ENV !== "production") global.altoraDbPool = pool;
  return pool;
}

export function getDb(): Pool {
  return global.altoraDbPool ?? createPool();
}

/**
 * Lazy proxy — pool dibuat saat query pertama, bukan saat modul diimpor.
 * Supaya `next build` tidak gagal karena tidak ada DATABASE_URL.
 */
export const db = new Proxy({} as Pool, {
  get(_target, property, receiver) {
    const pool = getDb();
    const value = Reflect.get(pool, property, receiver);
    return typeof value === "function" ? value.bind(pool) : value;
  },
});
