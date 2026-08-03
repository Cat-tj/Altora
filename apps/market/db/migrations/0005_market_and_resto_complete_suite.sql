-- ============================================================
-- Altora — Absensi, Transfer Stok, Gift Card & Audit Log
--
-- Idempoten: aman dijalankan berulang kali.
-- ============================================================

-- ── absensi karyawan ────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "Attendance" (
  id          text PRIMARY KEY,
  "tenantId"  text NOT NULL REFERENCES "Tenant"(id) ON DELETE CASCADE,
  "outletId"  text NOT NULL REFERENCES "Outlet"(id) ON DELETE CASCADE,
  "userId"    text NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  "clockIn"   timestamptz NOT NULL DEFAULT NOW(),
  "clockOut"  timestamptz,
  notes       text
);
CREATE INDEX IF NOT EXISTS "Attendance_tenant_user_idx" ON "Attendance" ("tenantId", "userId");

-- ── transfer stok antar cabang ──────────────────────────────

CREATE TABLE IF NOT EXISTS "StockTransfer" (
  id             text PRIMARY KEY,
  "tenantId"     text NOT NULL REFERENCES "Tenant"(id) ON DELETE CASCADE,
  "fromOutletId" text NOT NULL REFERENCES "Outlet"(id),
  "toOutletId"   text NOT NULL REFERENCES "Outlet"(id),
  "productId"    text NOT NULL REFERENCES "Product"(id),
  qty            integer NOT NULL,
  status         text NOT NULL DEFAULT 'PENDING',
  "createdById"  text NOT NULL REFERENCES "User"(id),
  "createdAt"    timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS "StockTransfer_tenantId_idx" ON "StockTransfer" ("tenantId");

-- ── voucher & gift card ─────────────────────────────────────

CREATE TABLE IF NOT EXISTS "GiftCard" (
  id             text PRIMARY KEY,
  "tenantId"     text NOT NULL REFERENCES "Tenant"(id) ON DELETE CASCADE,
  code           text NOT NULL UNIQUE,
  "initialValue" integer NOT NULL,
  balance        integer NOT NULL,
  "isActive"     boolean NOT NULL DEFAULT true,
  "createdAt"    timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS "GiftCard_tenantId_idx" ON "GiftCard" ("tenantId");
