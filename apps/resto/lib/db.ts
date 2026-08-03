import { Pool } from "pg";

declare global {
  var altoraRestoPool: Pool | undefined;
}

function createPool() {
  const value = process.env.DATABASE_URL;
  if (!value) throw new Error("DATABASE_URL Resto belum diatur.");

  const pool = new Pool({ connectionString: value });
  if (process.env.NODE_ENV !== "production") global.altoraRestoPool = pool;
  return pool;
}

export function getDb() {
  return global.altoraRestoPool ?? createPool();
}

export const db = new Proxy({} as Pool, {
  get(_target, property, receiver) {
    const pool = getDb();
    const value = Reflect.get(pool, property, receiver);
    return typeof value === "function" ? value.bind(pool) : value;
  },
});
