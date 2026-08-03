-- ============================================================
-- Altora — Migration 0009: POS variants, split payment, member
-- ============================================================
-- Additive only. Fresh DB + donor DB both migrate clean.
-- Guards: IF NOT EXISTS / DO blocks (same pattern as 0006-0008).

-- ── Product variant groups & options ─────────────────────────
CREATE TABLE IF NOT EXISTS "ProductVariantGroup" (
  id         text PRIMARY KEY,
  "tenantId" text NOT NULL REFERENCES "Tenant"(id) ON DELETE CASCADE,
  "productId" text NOT NULL REFERENCES "Product"(id) ON DELETE CASCADE,
  name       text NOT NULL,
  type       text NOT NULL DEFAULT 'SINGLE',   -- SINGLE (pilih 1) | MULTIPLE (boleh lebih)
  required   boolean NOT NULL DEFAULT false,
  "sortOrder" integer NOT NULL DEFAULT 0,
  "createdAt" timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS "ProductVariantGroup_tenant_idx" ON "ProductVariantGroup" ("tenantId");
CREATE INDEX IF NOT EXISTS "ProductVariantGroup_product_idx" ON "ProductVariantGroup" ("productId");

CREATE TABLE IF NOT EXISTS "ProductVariantOption" (
  id              text PRIMARY KEY,
  "tenantId"      text NOT NULL REFERENCES "Tenant"(id) ON DELETE CASCADE,
  "variantGroupId" text NOT NULL REFERENCES "ProductVariantGroup"(id) ON DELETE CASCADE,
  name            text NOT NULL,
  "priceDelta"    integer NOT NULL DEFAULT 0,   -- Rupiah, ditambahkan ke harga produk
  "sortOrder"     integer NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS "ProductVariantOption_tenant_idx" ON "ProductVariantOption" ("tenantId");
CREATE INDEX IF NOT EXISTS "ProductVariantOption_group_idx" ON "ProductVariantOption" ("variantGroupId");

-- ── Split payment ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "SalePayment" (
  id         text PRIMARY KEY,
  "tenantId" text NOT NULL REFERENCES "Tenant"(id) ON DELETE CASCADE,
  "saleId"   text NOT NULL REFERENCES "Sale"(id) ON DELETE CASCADE,
  method     "PaymentMethod" NOT NULL,
  amount     integer NOT NULL CHECK (amount > 0)
);
CREATE INDEX IF NOT EXISTS "SalePayment_tenant_idx" ON "SalePayment" ("tenantId");
CREATE INDEX IF NOT EXISTS "SalePayment_sale_idx" ON "SalePayment" ("saleId");

-- ── Sale: member + variant snapshot columns ──────────────────
ALTER TABLE "Sale" ADD COLUMN IF NOT EXISTS "memberId" text REFERENCES "Member"(id);
CREATE INDEX IF NOT EXISTS "Sale_member_idx" ON "Sale" ("memberId") WHERE "memberId" IS NOT NULL;

ALTER TABLE "SaleItem" ADD COLUMN IF NOT EXISTS "variantLabel" text;
ALTER TABLE "SaleItem" ADD COLUMN IF NOT EXISTS "variantPriceDelta" integer NOT NULL DEFAULT 0;

-- ── DB-level balance guard (deposit tidak boleh negatif) ─────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'Member_deposit_nonnegative'
  ) THEN
    ALTER TABLE "Member" ADD CONSTRAINT "Member_deposit_nonnegative" CHECK ("depositBalance" >= 0);
  END IF;
END
$$;

-- ── Audit actions untuk mutasi saldo member (additive) ───────
DO $$
BEGIN
  ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'MEMBER_DEPOSIT_DEBIT';
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$
BEGIN
  ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'MEMBER_POINTS_EARN';
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
