-- ============================================================
-- Altora Market — Laporan, Pengeluaran, Member & Promo
--
-- Idempoten: aman dijalankan berulang kali.
-- ============================================================

-- ── pengeluaran operasional ─────────────────────────────────

CREATE TABLE IF NOT EXISTS "Expense" (
  id            text PRIMARY KEY,
  "tenantId"    text NOT NULL REFERENCES "Tenant"(id) ON DELETE CASCADE,
  "outletId"    text NOT NULL REFERENCES "Outlet"(id) ON DELETE CASCADE,
  category      text NOT NULL DEFAULT 'OTHER',
  amount        integer NOT NULL,
  description   text,
  "createdById" text NOT NULL REFERENCES "User"(id),
  "createdAt"   timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS "Expense_tenant_created_idx" ON "Expense" ("tenantId", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS "Expense_tenant_outlet_idx" ON "Expense" ("tenantId", "outletId");

-- ── pelanggan & member ──────────────────────────────────────

CREATE TABLE IF NOT EXISTS "Member" (
  id               text PRIMARY KEY,
  "tenantId"       text NOT NULL REFERENCES "Tenant"(id) ON DELETE CASCADE,
  name             text NOT NULL,
  phone            text NOT NULL,
  email            text,
  points           integer NOT NULL DEFAULT 0,
  "depositBalance" integer NOT NULL DEFAULT 0,
  "createdAt"      timestamptz NOT NULL DEFAULT NOW(),
  "updatedAt"      timestamptz NOT NULL DEFAULT NOW(),
  CONSTRAINT "Member_tenant_phone_key" UNIQUE ("tenantId", "phone")
);
CREATE INDEX IF NOT EXISTS "Member_tenantId_idx" ON "Member" ("tenantId");

CREATE TABLE IF NOT EXISTS "PointTransaction" (
  id         text PRIMARY KEY,
  "tenantId" text NOT NULL REFERENCES "Tenant"(id) ON DELETE CASCADE,
  "memberId" text NOT NULL REFERENCES "Member"(id) ON DELETE CASCADE,
  type       text NOT NULL DEFAULT 'EARN',
  points     integer NOT NULL,
  "saleId"   text REFERENCES "Sale"(id) ON DELETE SET NULL,
  note       text,
  "createdAt" timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS "PointTransaction_memberId_idx" ON "PointTransaction" ("memberId");

-- ── promo & diskon ──────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "Promo" (
  id                text PRIMARY KEY,
  "tenantId"        text NOT NULL REFERENCES "Tenant"(id) ON DELETE CASCADE,
  name              text NOT NULL,
  "discountPercent" integer,
  "discountAmount"  integer,
  "minPurchase"     integer NOT NULL DEFAULT 0,
  "isActive"        boolean NOT NULL DEFAULT true,
  "startDate"       timestamptz,
  "endDate"         timestamptz,
  "createdAt"       timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS "Promo_tenantId_idx" ON "Promo" ("tenantId");
