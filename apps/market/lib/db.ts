import { Pool } from "pg";

declare global {
  var altoraMarketPool: Pool | undefined;
}

function getDatabaseUrl() {
  const value = process.env.DATABASE_URL;
  if (!value) throw new Error("DATABASE_URL Market belum diatur.");
  return value;
}

export const db = global.altoraMarketPool ?? new Pool({ connectionString: getDatabaseUrl() });

if (process.env.NODE_ENV !== "production") global.altoraMarketPool = db;
