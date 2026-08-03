-- ============================================================
-- Altora Market — ledger stok, supplier, PO, dan penerimaan barang
--
-- Ledger didahulukan dengan sengaja. Sampai sekarang hanya penjualan yang
-- mengubah "ProductStock".qty, jadi selisih stok masih bisa ditebak asalnya.
-- Begitu penerimaan barang ikut menulis, ada dua sumber perubahan dan saldo
-- saja tidak cukup untuk menelusuri.
--
-- "StockLedger" bersifat append-only: setiap perubahan qty menulis satu baris
-- berisi delta dan saldo hasilnya, di transaksi yang sama dengan perubahan
-- saldonya. Saldo tetap ada di "ProductStock" supaya kasir tidak perlu
-- menjumlah ledger setiap kali membaca stok.
--
-- Catatan: donor memakai "StockMovement" berbasis warehouse. Market bekerja
-- per outlet, jadi bentuknya disesuaikan, bukan disalin.
--
-- Idempoten: aman dijalankan berulang kali.
-- ============================================================

DO $$ BEGIN
  CREATE TYPE "StockLedgerSource" AS ENUM (
    'OPENING',        -- saldo awal saat ledger mulai dipakai
    'SALE',           -- penjualan mengurangi stok
    'SALE_VOID',      -- pembatalan mengembalikan stok
    'RECEIPT',        -- penerimaan barang menambah stok
    'ADJUSTMENT'      -- koreksi manual, termasuk hasil stock opname
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "SupplierStatus" AS ENUM ('ACTIVE', 'INACTIVE');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "PurchaseOrderStatus" AS ENUM (
    'DRAFT', 'SENT', 'CONFIRMED', 'PARTIALLY_RECEIVED', 'RECEIVED', 'CANCELLED'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "StockReceiptStatus" AS ENUM ('DRAFT', 'COMPLETED', 'CANCELLED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── ledger stok ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "StockLedger" (
  id               text PRIMARY KEY,
  "tenantId"       text NOT NULL REFERENCES "Tenant"(id) ON DELETE CASCADE,
  "outletId"       text NOT NULL REFERENCES "Outlet"(id) ON DELETE CASCADE,
  "productId"      text NOT NULL REFERENCES "Product"(id) ON DELETE CASCADE,
  delta            integer NOT NULL,      -- negatif untuk keluar
  "balanceAfter"   integer NOT NULL,      -- saldo setelah baris ini
  source           "StockLedgerSource" NOT NULL,
  "sourceId"       text,                  -- id Sale, StockReceipt, dst
  "actorId"        text REFERENCES "User"(id),
  note             text,
  -- Menahan penulisan ganda saat request diulang. Satu peristiwa stok hanya
  -- boleh tercatat sekali, sekalipun aksinya dikirim dua kali.
  "idempotencyKey" text NOT NULL UNIQUE,
  "createdAt"      timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS "StockLedger_product_outlet_idx"
  ON "StockLedger" ("tenantId", "outletId", "productId", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS "StockLedger_source_idx" ON "StockLedger" (source, "sourceId");

-- Saldo yang sudah ada sebelum ledger dipakai dicatat sebagai satu baris
-- pembuka, supaya penjumlahan ledger selalu sama dengan "ProductStock".qty.
INSERT INTO "StockLedger" (id, "tenantId", "outletId", "productId", delta, "balanceAfter", source, note, "idempotencyKey")
SELECT
  'led_open_' || ps.id,
  ps."tenantId", ps."outletId", ps."productId",
  ps.qty, ps.qty, 'OPENING',
  'Saldo awal saat ledger stok mulai dipakai',
  'opening:' || ps.id
FROM "ProductStock" ps
WHERE NOT EXISTS (SELECT 1 FROM "StockLedger" l WHERE l."idempotencyKey" = 'opening:' || ps.id);

-- ── supplier ────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "Supplier" (
  id              text PRIMARY KEY,
  "tenantId"      text NOT NULL REFERENCES "Tenant"(id) ON DELETE CASCADE,
  name            text NOT NULL,
  phone           text,
  email           text,
  address         text,
  "contactPerson" text,
  "paymentTerms"  text,               -- "Net 30", "COD", "DP 50%"
  "taxId"         text,               -- NPWP
  notes           text,
  status          "SupplierStatus" NOT NULL DEFAULT 'ACTIVE',
  "createdAt"     timestamptz NOT NULL DEFAULT NOW(),
  "updatedAt"     timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS "Supplier_tenant_status_idx" ON "Supplier" ("tenantId", status);

-- ── purchase order ──────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "PurchaseOrder" (
  id            text PRIMARY KEY,
  "tenantId"    text NOT NULL REFERENCES "Tenant"(id) ON DELETE CASCADE,
  "supplierId"  text NOT NULL REFERENCES "Supplier"(id),
  "outletId"    text NOT NULL REFERENCES "Outlet"(id),
  "poNumber"    text NOT NULL,
  status        "PurchaseOrderStatus" NOT NULL DEFAULT 'DRAFT',
  "totalAmount" integer NOT NULL DEFAULT 0,
  "expectedAt"  timestamptz,
  notes         text,
  "createdById" text REFERENCES "User"(id),
  "createdAt"   timestamptz NOT NULL DEFAULT NOW(),
  "updatedAt"   timestamptz NOT NULL DEFAULT NOW(),
  CONSTRAINT "PurchaseOrder_tenant_number_key" UNIQUE ("tenantId", "poNumber")
);
CREATE INDEX IF NOT EXISTS "PurchaseOrder_tenant_status_idx" ON "PurchaseOrder" ("tenantId", status, "createdAt" DESC);

CREATE TABLE IF NOT EXISTS "PurchaseOrderItem" (
  id            text PRIMARY KEY,
  "tenantId"    text NOT NULL REFERENCES "Tenant"(id) ON DELETE CASCADE,
  "poId"        text NOT NULL REFERENCES "PurchaseOrder"(id) ON DELETE CASCADE,
  "productId"   text NOT NULL REFERENCES "Product"(id),
  qty           integer NOT NULL,
  "unitPrice"   integer NOT NULL,
  subtotal      integer NOT NULL,
  "qtyReceived" integer NOT NULL DEFAULT 0,
  CONSTRAINT "PurchaseOrderItem_po_product_key" UNIQUE ("poId", "productId")
);
CREATE INDEX IF NOT EXISTS "PurchaseOrderItem_poId_idx" ON "PurchaseOrderItem" ("poId");

-- ── penerimaan barang ───────────────────────────────────────

CREATE TABLE IF NOT EXISTS "StockReceipt" (
  id              text PRIMARY KEY,
  "tenantId"      text NOT NULL REFERENCES "Tenant"(id) ON DELETE CASCADE,
  "outletId"      text NOT NULL REFERENCES "Outlet"(id),
  -- Boleh tanpa PO: barang datang langsung dari supplier tanpa pesanan formal
  -- adalah hal biasa di toko kecil.
  "poId"          text REFERENCES "PurchaseOrder"(id) ON DELETE SET NULL,
  "supplierId"    text REFERENCES "Supplier"(id),
  "receiptNumber" text NOT NULL,
  status          "StockReceiptStatus" NOT NULL DEFAULT 'DRAFT',
  "shippingCost"  integer NOT NULL DEFAULT 0,
  "otherCost"     integer NOT NULL DEFAULT 0,
  notes           text,
  "receivedById"  text REFERENCES "User"(id),
  "receivedAt"    timestamptz NOT NULL DEFAULT NOW(),
  "completedAt"   timestamptz,
  "createdAt"     timestamptz NOT NULL DEFAULT NOW(),
  "updatedAt"     timestamptz NOT NULL DEFAULT NOW(),
  CONSTRAINT "StockReceipt_tenant_number_key" UNIQUE ("tenantId", "receiptNumber")
);
CREATE INDEX IF NOT EXISTS "StockReceipt_tenant_status_idx" ON "StockReceipt" ("tenantId", status, "receivedAt" DESC);

CREATE TABLE IF NOT EXISTS "StockReceiptItem" (
  id            text PRIMARY KEY,
  "tenantId"    text NOT NULL REFERENCES "Tenant"(id) ON DELETE CASCADE,
  "receiptId"   text NOT NULL REFERENCES "StockReceipt"(id) ON DELETE CASCADE,
  "productId"   text NOT NULL REFERENCES "Product"(id),
  "productName" text NOT NULL,   -- snapshot: nama boleh berubah setelahnya
  "qtyAccepted" integer NOT NULL DEFAULT 0,
  "qtyDefect"   integer NOT NULL DEFAULT 0,
  "unitCost"    integer NOT NULL DEFAULT 0,
  "batchNumber" text,
  notes         text,
  CONSTRAINT "StockReceiptItem_receipt_product_key" UNIQUE ("receiptId", "productId")
);
CREATE INDEX IF NOT EXISTS "StockReceiptItem_receiptId_idx" ON "StockReceiptItem" ("receiptId");
