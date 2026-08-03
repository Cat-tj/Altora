-- ============================================================
-- Altora Market — schema dasar
--
-- Ini bukan salinan schema donor. ShadyERP punya 118 model karena satu
-- database melayani semua vertical; Market hanya menyentuh dua belas tabel.
-- Yang ditulis di sini persis itu, dengan kolom yang benar-benar dibaca atau
-- ditulis oleh kode Market.
--
-- Nama tabel dan kolom sengaja dipertahankan sama dengan donor (PascalCase,
-- camelCase) supaya database yang sudah berjalan bisa dipakai apa adanya
-- tanpa migrasi data.
--
-- Idempoten: aman dijalankan berulang kali.
-- ============================================================

-- ── enum ────────────────────────────────────────────────────
-- Kode Market melakukan cast eksplisit ke "PaymentMethod", jadi tipe enumnya
-- harus benar-benar ada, bukan sekadar kolom text.

DO $$ BEGIN
  CREATE TYPE "UserRole" AS ENUM ('OWNER', 'MANAGER', 'STAFF');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "ProductKind" AS ENUM ('GOODS', 'SERVICE', 'ASSEMBLY', 'NON_INVENTORY', 'COST');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'QRIS', 'TRANSFER', 'EWALLET', 'DEPOSIT', 'GIFT_CARD');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "SaleStatus" AS ENUM ('COMPLETED', 'VOIDED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "ShiftStatus" AS ENUM ('OPEN', 'CLOSED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "AuditAction" AS ENUM (
    'SALE_VOID', 'SALE_RETURN', 'SALE_PAYMENT_CORRECTION',
    'PRODUCT_PRICE_CHANGE', 'PRODUCT_DEACTIVATE', 'PRODUCT_ACTIVATE',
    'PRODUCT_DELETE', 'USER_PASSWORD_RESET', 'PERIOD_LOCK', 'PERIOD_UNLOCK'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── tenant, outlet, pengguna ────────────────────────────────

CREATE TABLE IF NOT EXISTS "Tenant" (
  id          text PRIMARY KEY,
  name        text NOT NULL,
  "isActive"  boolean NOT NULL DEFAULT true,
  "createdAt" timestamptz NOT NULL DEFAULT NOW(),
  "updatedAt" timestamptz NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "Outlet" (
  id          text PRIMARY KEY,
  "tenantId"  text NOT NULL REFERENCES "Tenant"(id) ON DELETE CASCADE,
  name        text NOT NULL,
  "isActive"  boolean NOT NULL DEFAULT true,
  "createdAt" timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS "Outlet_tenantId_idx" ON "Outlet" ("tenantId");

CREATE TABLE IF NOT EXISTS "User" (
  id             text PRIMARY KEY,
  "tenantId"     text NOT NULL REFERENCES "Tenant"(id) ON DELETE CASCADE,
  name           text NOT NULL,
  email          text NOT NULL,
  "passwordHash" text NOT NULL,
  role           "UserRole" NOT NULL DEFAULT 'STAFF',
  "isActive"     boolean NOT NULL DEFAULT true,
  "createdAt"    timestamptz NOT NULL DEFAULT NOW()
);
-- Login mencari dengan LOWER(email); indeksnya harus cocok agar terpakai.
CREATE UNIQUE INDEX IF NOT EXISTS "User_email_lower_key" ON "User" (LOWER(email));
CREATE INDEX IF NOT EXISTS "User_tenantId_idx" ON "User" ("tenantId");

CREATE TABLE IF NOT EXISTS "UserOutlet" (
  id         text PRIMARY KEY,
  "tenantId" text NOT NULL REFERENCES "Tenant"(id) ON DELETE CASCADE,
  "userId"   text NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  "outletId" text NOT NULL REFERENCES "Outlet"(id) ON DELETE CASCADE,
  CONSTRAINT "UserOutlet_user_outlet_key" UNIQUE ("userId", "outletId")
);
CREATE INDEX IF NOT EXISTS "UserOutlet_tenant_user_idx" ON "UserOutlet" ("tenantId", "userId");

-- ── katalog dan stok ────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "Category" (
  id         text PRIMARY KEY,
  "tenantId" text NOT NULL REFERENCES "Tenant"(id) ON DELETE CASCADE,
  name       text NOT NULL
);
CREATE INDEX IF NOT EXISTS "Category_tenantId_idx" ON "Category" ("tenantId");

CREATE TABLE IF NOT EXISTS "Product" (
  id           text PRIMARY KEY,
  "tenantId"   text NOT NULL REFERENCES "Tenant"(id) ON DELETE CASCADE,
  "categoryId" text REFERENCES "Category"(id) ON DELETE SET NULL,
  name         text NOT NULL,
  sku          text,
  price        integer NOT NULL,  -- rupiah penuh, tanpa sen
  kind         "ProductKind" NOT NULL DEFAULT 'GOODS',
  "trackStock" boolean NOT NULL DEFAULT true,
  "isActive"   boolean NOT NULL DEFAULT true
);
CREATE INDEX IF NOT EXISTS "Product_tenant_active_idx" ON "Product" ("tenantId", "isActive");

CREATE TABLE IF NOT EXISTS "ProductStock" (
  id          text PRIMARY KEY,
  "tenantId"  text NOT NULL REFERENCES "Tenant"(id) ON DELETE CASCADE,
  "productId" text NOT NULL REFERENCES "Product"(id) ON DELETE CASCADE,
  "outletId"  text NOT NULL REFERENCES "Outlet"(id) ON DELETE CASCADE,
  qty         integer NOT NULL DEFAULT 0,
  "updatedAt" timestamptz NOT NULL DEFAULT NOW(),
  CONSTRAINT "ProductStock_product_outlet_key" UNIQUE ("productId", "outletId")
);
CREATE INDEX IF NOT EXISTS "ProductStock_tenant_outlet_idx" ON "ProductStock" ("tenantId", "outletId");

CREATE TABLE IF NOT EXISTS "StockReorderPoint" (
  id          text PRIMARY KEY,
  "tenantId"  text NOT NULL REFERENCES "Tenant"(id) ON DELETE CASCADE,
  "productId" text NOT NULL REFERENCES "Product"(id) ON DELETE CASCADE,
  "outletId"  text NOT NULL REFERENCES "Outlet"(id) ON DELETE CASCADE,
  "minQty"    integer NOT NULL DEFAULT 5,
  CONSTRAINT "StockReorderPoint_product_outlet_key" UNIQUE ("productId", "outletId")
);

-- ── shift dan transaksi ─────────────────────────────────────

CREATE TABLE IF NOT EXISTS "CashierShift" (
  id             text PRIMARY KEY,
  "tenantId"     text NOT NULL REFERENCES "Tenant"(id) ON DELETE CASCADE,
  "outletId"     text NOT NULL REFERENCES "Outlet"(id) ON DELETE CASCADE,
  "userId"       text NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  "openingCash"  integer NOT NULL,
  "closingCash"  integer,
  "expectedCash" integer,
  "varianceNote" text,
  status         "ShiftStatus" NOT NULL DEFAULT 'OPEN',
  "openedAt"     timestamptz NOT NULL DEFAULT NOW(),
  "closedAt"     timestamptz
);
-- Satu kasir hanya boleh punya satu shift terbuka; ditegakkan di database,
-- bukan hanya dicek di kode sebelum insert.
CREATE UNIQUE INDEX IF NOT EXISTS "CashierShift_one_open_per_user"
  ON "CashierShift" ("tenantId", "userId") WHERE status = 'OPEN';
CREATE INDEX IF NOT EXISTS "CashierShift_tenant_outlet_idx" ON "CashierShift" ("tenantId", "outletId");

CREATE TABLE IF NOT EXISTS "Sale" (
  id               text PRIMARY KEY,
  "tenantId"       text NOT NULL REFERENCES "Tenant"(id) ON DELETE CASCADE,
  "outletId"       text NOT NULL REFERENCES "Outlet"(id) ON DELETE CASCADE,
  "shiftId"        text REFERENCES "CashierShift"(id) ON DELETE SET NULL,
  "cashierId"      text NOT NULL REFERENCES "User"(id),
  "invoiceNumber"  text NOT NULL UNIQUE,
  subtotal         integer NOT NULL,
  "discountAmount" integer NOT NULL DEFAULT 0,
  "taxAmount"      integer NOT NULL DEFAULT 0,
  total            integer NOT NULL,
  "paymentMethod"  "PaymentMethod" NOT NULL,
  "amountPaid"     integer NOT NULL,
  "changeAmount"   integer NOT NULL DEFAULT 0,
  status           "SaleStatus" NOT NULL DEFAULT 'COMPLETED',
  "voidReason"     text,
  "createdAt"      timestamptz NOT NULL DEFAULT NOW(),
  "updatedAt"      timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS "Sale_tenant_outlet_created_idx" ON "Sale" ("tenantId", "outletId", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS "Sale_shiftId_idx" ON "Sale" ("shiftId");

CREATE TABLE IF NOT EXISTS "SaleItem" (
  id               text PRIMARY KEY,
  "tenantId"       text NOT NULL REFERENCES "Tenant"(id) ON DELETE CASCADE,
  "saleId"         text NOT NULL REFERENCES "Sale"(id) ON DELETE CASCADE,
  "productId"      text NOT NULL REFERENCES "Product"(id),
  "productName"    text NOT NULL,  -- snapshot: nama boleh berubah setelahnya
  price            integer NOT NULL,  -- snapshot harga saat transaksi
  qty              integer NOT NULL,
  "discountAmount" integer NOT NULL DEFAULT 0,
  subtotal         integer NOT NULL
);
CREATE INDEX IF NOT EXISTS "SaleItem_saleId_idx" ON "SaleItem" ("saleId");
CREATE INDEX IF NOT EXISTS "SaleItem_tenant_product_idx" ON "SaleItem" ("tenantId", "productId");

CREATE TABLE IF NOT EXISTS "AuditLog" (
  id          text PRIMARY KEY,
  "tenantId"  text NOT NULL REFERENCES "Tenant"(id) ON DELETE CASCADE,
  "userId"    text NOT NULL REFERENCES "User"(id),
  action      "AuditAction" NOT NULL,
  description text NOT NULL,
  "createdAt" timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS "AuditLog_tenant_created_idx" ON "AuditLog" ("tenantId", "createdAt" DESC);

-- ── idempotensi checkout ────────────────────────────────────
-- Sebuah request checkout yang diulang harus mengembalikan penjualan yang
-- sama, bukan membuat penjualan kedua.

CREATE TABLE IF NOT EXISTS "MarketCheckoutRequest" (
  id          text PRIMARY KEY,
  "tenantId"  text NOT NULL,
  "requestId" text NOT NULL,
  "saleId"    text NOT NULL,
  "createdAt" timestamptz NOT NULL DEFAULT NOW(),
  CONSTRAINT "MarketCheckoutRequest_tenant_request_key" UNIQUE ("tenantId", "requestId")
);
CREATE INDEX IF NOT EXISTS "MarketCheckoutRequest_saleId_idx" ON "MarketCheckoutRequest" ("saleId");
