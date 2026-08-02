import { Pool } from "pg";
import process from "node:process";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL Market belum diatur.");

const pool = new Pool({ connectionString: databaseUrl });

try {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS "MarketCheckoutRequest" (
      id text PRIMARY KEY,
      "tenantId" text NOT NULL,
      "requestId" text NOT NULL,
      "saleId" text NOT NULL,
      "createdAt" timestamptz NOT NULL DEFAULT NOW(),
      CONSTRAINT "MarketCheckoutRequest_tenant_request_key" UNIQUE ("tenantId", "requestId")
    )
  `);
  await pool.query(`CREATE INDEX IF NOT EXISTS "MarketCheckoutRequest_saleId_idx" ON "MarketCheckoutRequest" ("saleId")`);
  console.log("Schema idempotensi checkout Market tersedia.");
} finally {
  await pool.end();
}
