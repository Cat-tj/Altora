-- ============================================================
-- Altora — Schema Alignment 0011: sinkronisasi schema legacy prod
-- dengan struktur yang dibutuhkan kode branch orchestration/raphael-bootstrap.
--
-- Latar: prod (Supabase) memakai schema lama dengan bentuk tabel berbeda:
--   - "SaleReturnItem" memakai "saleReturnId" (bukan "returnId") dan tidak punya
--     productId/productName/restock/subtotal.
--   - "StockReceiptItem" tidak punya tenantId/productName/unitCost/notes.
--   - enum "PromoDiscountType" hanya berisi FIXED, PERCENT (tanpa PERCENTAGE).
--
-- Migration ini hanya MENAMBAH (additive): tidak menghapus kolom, tidak menulis
-- ulang data, aman dijalankan berulang kali.
-- ============================================================

-- ── 1. SaleReturnItem: kolom yang dipakai kode baru ─────────
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                  WHERE table_name = 'SaleReturnItem' AND column_name = 'returnId') THEN
    ALTER TABLE "SaleReturnItem" ADD COLUMN "returnId" text;
  END IF;
END $$;

-- Backfill hanya bila schema legacy memang memiliki saleReturnId.
-- Database baru dari 0003 sudah memakai returnId dan tidak memiliki kolom legacy.
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
              WHERE table_name = 'SaleReturnItem' AND column_name = 'saleReturnId') THEN
    EXECUTE 'UPDATE "SaleReturnItem" SET "returnId" = "saleReturnId" WHERE "returnId" IS NULL AND "saleReturnId" IS NOT NULL';
  END IF;
END $$;

ALTER TABLE "SaleReturnItem" ADD COLUMN IF NOT EXISTS "productId" text;
ALTER TABLE "SaleReturnItem" ADD COLUMN IF NOT EXISTS "productName" text;
ALTER TABLE "SaleReturnItem" ADD COLUMN IF NOT EXISTS restock boolean NOT NULL DEFAULT true;
ALTER TABLE "SaleReturnItem" ADD COLUMN IF NOT EXISTS subtotal integer NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS "SaleReturnItem_returnId_idx" ON "SaleReturnItem" ("returnId");

-- ── 2. StockReceiptItem: kolom yang dipakai kode baru ───────
ALTER TABLE "StockReceiptItem" ADD COLUMN IF NOT EXISTS "tenantId" text;
ALTER TABLE "StockReceiptItem" ADD COLUMN IF NOT EXISTS "productName" text;
ALTER TABLE "StockReceiptItem" ADD COLUMN IF NOT EXISTS "unitCost" integer NOT NULL DEFAULT 0;
ALTER TABLE "StockReceiptItem" ADD COLUMN IF NOT EXISTS notes text;
CREATE INDEX IF NOT EXISTS "StockReceiptItem_tenantId_idx" ON "StockReceiptItem" ("tenantId");

-- ── 3. PromoDiscountType: kode baru memakai 'PERCENTAGE' ────
-- Enum hanya ada pada schema production legacy; schema CI tertentu memakai text.
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'PromoDiscountType') THEN
    BEGIN
      ALTER TYPE "PromoDiscountType" ADD VALUE IF NOT EXISTS 'PERCENTAGE';
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
  END IF;
END $$;

-- ── 4. Koneksi tenant: pastikan kolom tenantId legacy terisi ──
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
              WHERE table_name = 'StockReceiptItem' AND column_name = 'tenantId') THEN
    UPDATE "StockReceiptItem" si
       SET "tenantId" = r."tenantId"
      FROM "StockReceipt" r
     WHERE si."receiptId" = r.id AND si."tenantId" IS NULL;
  END IF;
END $$;
