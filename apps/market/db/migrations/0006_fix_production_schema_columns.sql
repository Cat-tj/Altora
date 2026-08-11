-- ============================================================
-- Altora — Schema Column Patch for Pre-existing Supabase Tables
-- ============================================================
-- All donor-era backfills (totalRefund, processedById, startedBy,
-- completedBy, transferredById, sentById) are guarded by existence
-- checks: they only run on pre-existing donor DBs where those columns
-- exist. On fresh Altora DBs the columns are absent and the backfills
-- are no-ops. Discovered by the hardened migration runner (ALT-REC-IMP-001).

-- ── SaleReturn ──────────────────────────────────────────────
ALTER TABLE "SaleReturn" ADD COLUMN IF NOT EXISTS "outletId" text REFERENCES "Outlet"(id);
ALTER TABLE "SaleReturn" ADD COLUMN IF NOT EXISTS "returnNumber" text;
ALTER TABLE "SaleReturn" ADD COLUMN IF NOT EXISTS "refundAmount" integer DEFAULT 0;
ALTER TABLE "SaleReturn" ADD COLUMN IF NOT EXISTS "restockCount" integer DEFAULT 0;
ALTER TABLE "SaleReturn" ADD COLUMN IF NOT EXISTS "createdById" text REFERENCES "User"(id);

UPDATE "SaleReturn" SET "returnNumber" = 'RET-' || id WHERE "returnNumber" IS NULL;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'SaleReturn' AND column_name = 'totalRefund') THEN
    UPDATE "SaleReturn" SET "refundAmount" = "totalRefund"
    WHERE ("refundAmount" IS NULL OR "refundAmount" = 0) AND "totalRefund" IS NOT NULL;
  END IF;
END
$$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'SaleReturn' AND column_name = 'processedById') THEN
    UPDATE "SaleReturn" SET "createdById" = "processedById" WHERE "createdById" IS NULL AND "processedById" IS NOT NULL;
  END IF;
END
$$;

UPDATE "SaleReturn" r SET "outletId" = s."outletId" FROM "Sale" s WHERE r."saleId" = s.id AND r."outletId" IS NULL;

-- ── StockCount ──────────────────────────────────────────────
ALTER TABLE "StockCount" ADD COLUMN IF NOT EXISTS "createdById" text REFERENCES "User"(id);
ALTER TABLE "StockCount" ADD COLUMN IF NOT EXISTS "appliedById" text REFERENCES "User"(id);
ALTER TABLE "StockCount" ADD COLUMN IF NOT EXISTS "appliedAt" timestamptz;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'StockCount' AND column_name = 'startedBy') THEN
    UPDATE "StockCount" SET "createdById" = "startedBy" WHERE "createdById" IS NULL AND "startedBy" IS NOT NULL;
  END IF;
END
$$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'StockCount' AND column_name = 'completedBy') THEN
    UPDATE "StockCount" SET "appliedById" = "completedBy" WHERE "appliedById" IS NULL AND "completedBy" IS NOT NULL;
  END IF;
END
$$;

-- ── StockTransfer ───────────────────────────────────────────
ALTER TABLE "StockTransfer" ADD COLUMN IF NOT EXISTS "createdById" text REFERENCES "User"(id);

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'StockTransfer' AND column_name = 'transferredById') THEN
    UPDATE "StockTransfer" SET "createdById" = "transferredById" WHERE "createdById" IS NULL AND "transferredById" IS NOT NULL;
  END IF;
END
$$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'StockTransfer' AND column_name = 'sentById') THEN
    UPDATE "StockTransfer" SET "createdById" = "sentById" WHERE "createdById" IS NULL AND "sentById" IS NOT NULL;
  END IF;
END
$$;
