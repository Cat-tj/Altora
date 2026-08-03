-- ============================================================
-- Altora Resto — schema khusus F&B (Meja, Pesanan Meja, Modifiers, Resep)
--
-- Idempoten: aman dijalankan berulang kali.
-- ============================================================

-- ── enum / tipe data ────────────────────────────────────────

DO $$ BEGIN
  CREATE TYPE "TableStatus" AS ENUM ('AVAILABLE', 'OCCUPIED', 'RESERVED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "TableOrderStatus" AS ENUM ('PENDING', 'PREPARING', 'READY', 'COMPLETED', 'CANCELLED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "OrderItemStatus" AS ENUM ('PENDING', 'COOKING', 'READY', 'SERVED', 'CANCELLED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── meja dan layanan ────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "Table" (
  id          text PRIMARY KEY,
  "tenantId"  text NOT NULL REFERENCES "Tenant"(id) ON DELETE CASCADE,
  "outletId"  text NOT NULL REFERENCES "Outlet"(id) ON DELETE CASCADE,
  name        text NOT NULL,
  status      "TableStatus" NOT NULL DEFAULT 'AVAILABLE',
  "qrToken"   text UNIQUE,
  "createdAt" timestamptz NOT NULL DEFAULT NOW(),
  "updatedAt" timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS "Table_tenant_outlet_idx" ON "Table" ("tenantId", "outletId");

CREATE TABLE IF NOT EXISTS "TableOrder" (
  id            text PRIMARY KEY,
  "tenantId"    text NOT NULL REFERENCES "Tenant"(id) ON DELETE CASCADE,
  "outletId"    text NOT NULL REFERENCES "Outlet"(id) ON DELETE CASCADE,
  "tableId"     text REFERENCES "Table"(id) ON DELETE SET NULL,
  "orderNumber" text NOT NULL,
  status        "TableOrderStatus" NOT NULL DEFAULT 'PENDING',
  total         integer NOT NULL,
  notes         text,
  "createdById" text NOT NULL REFERENCES "User"(id),
  "createdAt"   timestamptz NOT NULL DEFAULT NOW(),
  "updatedAt"   timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS "TableOrder_tenant_outlet_idx" ON "TableOrder" ("tenantId", "outletId");

CREATE TABLE IF NOT EXISTS "TableOrderItem" (
  id            text PRIMARY KEY,
  "tenantId"    text NOT NULL REFERENCES "Tenant"(id) ON DELETE CASCADE,
  "orderId"     text NOT NULL REFERENCES "TableOrder"(id) ON DELETE CASCADE,
  "productId"   text NOT NULL REFERENCES "Product"(id),
  "productName" text NOT NULL,
  price         integer NOT NULL,
  qty           integer NOT NULL,
  notes         text,
  status        "OrderItemStatus" NOT NULL DEFAULT 'PENDING'
);
CREATE INDEX IF NOT EXISTS "TableOrderItem_orderId_idx" ON "TableOrderItem" ("orderId");

-- ── modifier produk ─────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "ModifierGroup" (
  id         text PRIMARY KEY,
  "tenantId" text NOT NULL REFERENCES "Tenant"(id) ON DELETE CASCADE,
  "categoryId" text NOT NULL REFERENCES "Category"(id) ON DELETE CASCADE,
  name       text NOT NULL,
  type       text NOT NULL DEFAULT 'SINGLE', -- SINGLE / MULTIPLE
  required   boolean NOT NULL DEFAULT false,
  "sortOrder" integer NOT NULL DEFAULT 0,
  "createdAt" timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS "ModifierGroup_tenantId_idx" ON "ModifierGroup" ("tenantId");

CREATE TABLE IF NOT EXISTS "ModifierOption" (
  id                text PRIMARY KEY,
  "tenantId"        text NOT NULL REFERENCES "Tenant"(id) ON DELETE CASCADE,
  "modifierGroupId" text NOT NULL REFERENCES "ModifierGroup"(id) ON DELETE CASCADE,
  name              text NOT NULL,
  "priceDelta"      integer NOT NULL DEFAULT 0,
  "sortOrder"       integer NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS "ModifierOption_modifierGroupId_idx" ON "ModifierOption" ("modifierGroupId");

CREATE TABLE IF NOT EXISTS "ProductModifierExclusion" (
  id                text PRIMARY KEY,
  "tenantId"        text NOT NULL REFERENCES "Tenant"(id) ON DELETE CASCADE,
  "productId"       text NOT NULL REFERENCES "Product"(id) ON DELETE CASCADE,
  "modifierGroupId" text NOT NULL REFERENCES "ModifierGroup"(id) ON DELETE CASCADE,
  CONSTRAINT "ProductModifierExclusion_product_modifier_key" UNIQUE ("productId", "modifierGroupId")
);

-- ── resep dan bahan baku ────────────────────────────────────

CREATE TABLE IF NOT EXISTS "ProductRecipeItem" (
  id                   text PRIMARY KEY,
  "tenantId"           text NOT NULL REFERENCES "Tenant"(id) ON DELETE CASCADE,
  "productId"          text NOT NULL REFERENCES "Product"(id) ON DELETE CASCADE,
  "ingredientProductId" text NOT NULL REFERENCES "Product"(id) ON DELETE CASCADE,
  qty                  integer NOT NULL,
  CONSTRAINT "ProductRecipeItem_product_ingredient_key" UNIQUE ("productId", "ingredientProductId")
);
CREATE INDEX IF NOT EXISTS "ProductRecipeItem_productId_idx" ON "ProductRecipeItem" ("productId");
