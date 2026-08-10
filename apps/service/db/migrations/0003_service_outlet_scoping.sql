-- Service migration 0003: Service Multi-Outlet Scoping
-- Adds outletId column to ServiceSale and composite tenant/outlet FK integrity

ALTER TABLE "ServiceSale"
  ADD COLUMN IF NOT EXISTS "outletId" text;

-- Set default fallback outlet for existing rows if needed
UPDATE "ServiceSale"
  SET "outletId" = 'outlet_market_1'
  WHERE "outletId" IS NULL;

-- Make outletId NOT NULL
ALTER TABLE "ServiceSale"
  ALTER COLUMN "outletId" SET NOT NULL;

-- Index for outlet-scoped queries
CREATE INDEX IF NOT EXISTS "ServiceSale_tenant_outlet_created_idx"
  ON "ServiceSale" ("tenantId", "outletId", "createdAt" DESC);
