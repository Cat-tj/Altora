-- Service migration 0003: Service Multi-Outlet Scoping & Database Integrity
-- Adds outletId column to ServiceSale and composite tenant/outlet FK integrity

ALTER TABLE "ServiceSale"
  ADD COLUMN IF NOT EXISTS "outletId" text;

-- Backfill outletId from existing Outlet records belonging to the same tenant if needed
UPDATE "ServiceSale" s
  SET "outletId" = (
    SELECT o.id FROM "Outlet" o WHERE o."tenantId" = s."tenantId" LIMIT 1
  )
  WHERE s."outletId" IS NULL;

-- Make outletId NOT NULL
ALTER TABLE "ServiceSale"
  ALTER COLUMN "outletId" SET NOT NULL;

-- Ensure Outlet has UNIQUE ("tenantId", "id") constraint for composite FK target
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'Outlet_tenantId_id_key'
      AND table_name = 'Outlet'
  ) THEN
    ALTER TABLE "Outlet" ADD CONSTRAINT "Outlet_tenantId_id_key" UNIQUE ("tenantId", "id");
  END IF;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Add composite FK constraint on ServiceSale(tenantId, outletId) referencing Outlet(tenantId, id)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'ServiceSale_tenant_outlet_fk'
      AND table_name = 'ServiceSale'
  ) THEN
    ALTER TABLE "ServiceSale"
      ADD CONSTRAINT "ServiceSale_tenant_outlet_fk"
      FOREIGN KEY ("tenantId", "outletId")
      REFERENCES "Outlet"("tenantId", "id")
      ON DELETE RESTRICT;
  END IF;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Index for outlet-scoped queries
CREATE INDEX IF NOT EXISTS "ServiceSale_tenant_outlet_created_idx"
  ON "ServiceSale" ("tenantId", "outletId", "createdAt" DESC);
