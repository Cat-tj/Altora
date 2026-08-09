-- ============================================================
-- Altora — Master Schema Alignment Migration 0007
-- Fixes missing columns on pre-existing Supabase production tables
-- ============================================================

-- ── 1. StockReceipt (Penerimaan Barang) ─────────────────────
ALTER TABLE "StockReceipt" ADD COLUMN IF NOT EXISTS "supplierId" text REFERENCES "Supplier"(id);
ALTER TABLE "StockReceipt" ADD COLUMN IF NOT EXISTS "supplierName" text;

-- ── 2. StockCountItem (Stock Opname Items) ──────────────────
ALTER TABLE "StockCountItem" ADD COLUMN IF NOT EXISTS "countedQty" integer DEFAULT 0;
ALTER TABLE "StockCountItem" ADD COLUMN IF NOT EXISTS "productName" text;
ALTER TABLE "StockCountItem" ADD COLUMN IF NOT EXISTS "tenantId" text REFERENCES "Tenant"(id);

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'StockCountItem' AND column_name = 'physicalQty') THEN
    UPDATE "StockCountItem" SET "countedQty" = "physicalQty"
    WHERE ("countedQty" IS NULL OR "countedQty" = 0) AND "physicalQty" IS NOT NULL;
  END IF;
END
$$;
UPDATE "StockCountItem" i SET "productName" = p.name FROM "Product" p WHERE i."productId" = p.id AND i."productName" IS NULL;

-- ── 3. Expense (Pengeluaran Operasional) ────────────────────
ALTER TABLE "Expense" ADD COLUMN IF NOT EXISTS "description" text;
ALTER TABLE "Expense" ADD COLUMN IF NOT EXISTS "category" text DEFAULT 'OTHER';

-- ── 4. GiftCard & Promo (Voucher & Promo) ───────────────────
ALTER TABLE "GiftCard" ADD COLUMN IF NOT EXISTS "isActive" boolean DEFAULT true;
ALTER TABLE "Promo" ADD COLUMN IF NOT EXISTS "isActive" boolean DEFAULT true;
