-- Migration 0012: Product expiry tracking & indexing
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "expiredAt" timestamptz;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "cost" integer;
CREATE INDEX IF NOT EXISTS "Product_expiredAt_idx" ON "Product" ("tenantId", "expiredAt");
