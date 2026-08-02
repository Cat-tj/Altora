import { Pool } from "pg";

declare global {
  var altoraMarketPool: Pool | undefined;
}

function createPool() {
  const value = process.env.DATABASE_URL;
  if (!value) throw new Error("DATABASE_URL Market belum diatur.");

  const pool = new Pool({ connectionString: value });
  if (process.env.NODE_ENV !== "production") global.altoraMarketPool = pool;
  return pool;
}

export function getDb() {
  return global.altoraMarketPool ?? createPool();
}

/**
 * Pool dibuat saat query pertama, bukan saat modul diimpor.
 *
 * Sebelumnya pool dibangun di tingkat modul, sehingga `next build` gagal
 * mengumpulkan halaman yang menyentuh database kecuali ada DATABASE_URL yang
 * hidup. Build seharusnya tidak menuntut database; hanya request yang menuntut.
 */
export const db = new Proxy({} as Pool, {
  get(_target, property, receiver) {
    const pool = getDb();
    const value = Reflect.get(pool, property, receiver);
    return typeof value === "function" ? value.bind(pool) : value;
  },
});
