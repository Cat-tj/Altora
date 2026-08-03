-- ============================================================
-- Altora Market — retur penjualan dan stock opname
--
-- Keduanya menempel ke ledger yang sudah ada. Retur mengembalikan sebagian
-- barang dari satu penjualan; stock opname mencocokkan hitungan fisik dengan
-- saldo dan menuliskan selisihnya sebagai koreksi.
--
-- Idempoten: aman dijalankan berulang kali.
-- ============================================================

-- Retur punya sumber sendiri, bukan menumpang SALE_VOID. Pembatalan
-- membatalkan seluruh transaksi; retur mengembalikan sebagian dan uangnya
-- ikut kembali. Kalau keduanya dicatat sama, laporan tidak bisa memisahkan.
DO $$ BEGIN
  ALTER TYPE "StockLedgerSource" ADD VALUE IF NOT EXISTS 'RETURN';
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "StockCountStatus" AS ENUM ('DRAFT', 'APPLIED', 'CANCELLED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── retur penjualan ─────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "SaleReturn" (
  id             text PRIMARY KEY,
  "tenantId"     text NOT NULL REFERENCES "Tenant"(id) ON DELETE CASCADE,
  "saleId"       text NOT NULL REFERENCES "Sale"(id),
  "outletId"     text NOT NULL REFERENCES "Outlet"(id),
  "returnNumber" text NOT NULL,
  reason         text NOT NULL,
  "refundAmount" integer NOT NULL,
  -- Barang rusak tidak kembali ke rak; qty-nya tercatat tapi tidak menambah
  -- stok, sama seperti barang rusak pada penerimaan.
  "restockCount" integer NOT NULL DEFAULT 0,
  "createdById"  text NOT NULL REFERENCES "User"(id),
  "createdAt"    timestamptz NOT NULL DEFAULT NOW(),
  CONSTRAINT "SaleReturn_tenant_number_key" UNIQUE ("tenantId", "returnNumber")
);
CREATE INDEX IF NOT EXISTS "SaleReturn_sale_idx" ON "SaleReturn" ("saleId");
CREATE INDEX IF NOT EXISTS "SaleReturn_tenant_created_idx" ON "SaleReturn" ("tenantId", "createdAt" DESC);

CREATE TABLE IF NOT EXISTS "SaleReturnItem" (
  id            text PRIMARY KEY,
  "tenantId"    text NOT NULL REFERENCES "Tenant"(id) ON DELETE CASCADE,
  "returnId"    text NOT NULL REFERENCES "SaleReturn"(id) ON DELETE CASCADE,
  "saleItemId"  text NOT NULL REFERENCES "SaleItem"(id),
  "productId"   text NOT NULL REFERENCES "Product"(id),
  "productName" text NOT NULL,
  qty           integer NOT NULL,
  restock       boolean NOT NULL DEFAULT true,
  subtotal      integer NOT NULL,
  CONSTRAINT "SaleReturnItem_return_item_key" UNIQUE ("returnId", "saleItemId")
);
CREATE INDEX IF NOT EXISTS "SaleReturnItem_returnId_idx" ON "SaleReturnItem" ("returnId");

-- ── stock opname ────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "StockCount" (
  id            text PRIMARY KEY,
  "tenantId"    text NOT NULL REFERENCES "Tenant"(id) ON DELETE CASCADE,
  "outletId"    text NOT NULL REFERENCES "Outlet"(id),
  "countNumber" text NOT NULL,
  status        "StockCountStatus" NOT NULL DEFAULT 'DRAFT',
  notes         text,
  "createdById" text NOT NULL REFERENCES "User"(id),
  "appliedById" text REFERENCES "User"(id),
  "createdAt"   timestamptz NOT NULL DEFAULT NOW(),
  "appliedAt"   timestamptz,
  CONSTRAINT "StockCount_tenant_number_key" UNIQUE ("tenantId", "countNumber")
);
CREATE INDEX IF NOT EXISTS "StockCount_tenant_status_idx" ON "StockCount" ("tenantId", status, "createdAt" DESC);

CREATE TABLE IF NOT EXISTS "StockCountItem" (
  id            text PRIMARY KEY,
  "tenantId"    text NOT NULL REFERENCES "Tenant"(id) ON DELETE CASCADE,
  "countId"     text NOT NULL REFERENCES "StockCount"(id) ON DELETE CASCADE,
  "productId"   text NOT NULL REFERENCES "Product"(id),
  "productName" text NOT NULL,
  -- Saldo sistem dibekukan saat opname dibuat. Kalau dibaca ulang saat
  -- diterapkan, penjualan yang terjadi di sela-selanya akan ikut terhapus
  -- oleh koreksi.
  "systemQty"   integer NOT NULL,
  "countedQty"  integer NOT NULL,
  notes         text,
  CONSTRAINT "StockCountItem_count_product_key" UNIQUE ("countId", "productId")
);
CREATE INDEX IF NOT EXISTS "StockCountItem_countId_idx" ON "StockCountItem" ("countId");
