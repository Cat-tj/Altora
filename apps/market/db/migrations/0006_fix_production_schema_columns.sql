-- ============================================================
-- Altora — Schema Column Patch for Pre-existing Supabase Tables
-- ============================================================

-- ── SaleReturn ──────────────────────────────────────────────
ALTER TABLE "SaleReturn" ADD COLUMN IF NOT EXISTS "outletId" text REFERENCES "Outlet"(id);
ALTER TABLE "SaleReturn" ADD COLUMN IF NOT EXISTS "returnNumber" text;
ALTER TABLE "SaleReturn" ADD COLUMN IF NOT EXISTS "refundAmount" integer DEFAULT 0;
ALTER TABLE "SaleReturn" ADD COLUMN IF NOT EXISTS "restockCount" integer DEFAULT 0;
ALTER TABLE "SaleReturn" ADD COLUMN IF NOT EXISTS "createdById" text REFERENCES "User"(id);

UPDATE "SaleReturn" SET "returnNumber" = 'RET-' || id WHERE "returnNumber" IS NULL;
UPDATE "SaleReturn" SET "refundAmount" = "totalRefund" WHERE ("refundAmount" IS NULL OR "refundAmount" = 0) AND "totalRefund" IS NOT NULL;
UPDATE "SaleReturn" SET "createdById" = "processedById" WHERE "createdById" IS NULL AND "processedById" IS NOT NULL;
UPDATE "SaleReturn" r SET "outletId" = s."outletId" FROM "Sale" s WHERE r."saleId" = s.id AND r."outletId" IS NULL;

-- ── StockCount ──────────────────────────────────────────────
ALTER TABLE "StockCount" ADD COLUMN IF NOT EXISTS "createdById" text REFERENCES "User"(id);
ALTER TABLE "StockCount" ADD COLUMN IF NOT EXISTS "appliedById" text REFERENCES "User"(id);
ALTER TABLE "StockCount" ADD COLUMN IF NOT EXISTS "appliedAt" timestamptz;

UPDATE "StockCount" SET "createdById" = "startedBy" WHERE "createdById" IS NULL AND "startedBy" IS NOT NULL;
UPDATE "StockCount" SET "appliedById" = "completedBy" WHERE "appliedById" IS NULL AND "completedBy" IS NOT NULL;

-- ── StockTransfer ───────────────────────────────────────────
ALTER TABLE "StockTransfer" ADD COLUMN IF NOT EXISTS "createdById" text REFERENCES "User"(id);
UPDATE "StockTransfer" SET "createdById" = "transferredById" WHERE "createdById" IS NULL AND "transferredById" IS NOT NULL;
UPDATE "StockTransfer" SET "createdById" = "sentById" WHERE "createdById" IS NULL AND "sentById" IS NOT NULL;
