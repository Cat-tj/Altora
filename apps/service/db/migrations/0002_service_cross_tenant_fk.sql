-- Service migration 0002: add composite tenant FK integrity (idempotent)
-- Adds UNIQUE (tenantId, id) on parent tables so children can use
-- composite FKs that prevent cross-tenant associations.

-- ServiceCatalogItem: composite unique for FK target
DO $$ BEGIN
  ALTER TABLE "ServiceCatalogItem"
    ADD CONSTRAINT "ServiceCatalogItem_tenant_id_key" UNIQUE ("tenantId", id);
EXCEPTION WHEN duplicate_table THEN NULL;
         WHEN duplicate_object THEN NULL;
END $$;

-- ServiceStaff: composite unique for FK target
DO $$ BEGIN
  ALTER TABLE "ServiceStaff"
    ADD CONSTRAINT "ServiceStaff_tenant_id_key" UNIQUE ("tenantId", id);
EXCEPTION WHEN duplicate_table THEN NULL;
         WHEN duplicate_object THEN NULL;
END $$;

-- ServiceSale: composite unique for FK target
DO $$ BEGIN
  ALTER TABLE "ServiceSale"
    ADD CONSTRAINT "ServiceSale_tenant_id_key" UNIQUE ("tenantId", id);
EXCEPTION WHEN duplicate_table THEN NULL;
         WHEN duplicate_object THEN NULL;
END $$;

-- ServiceSaleItem: enforce cross-tenant sale integrity via composite FK
DO $$ BEGIN
  ALTER TABLE "ServiceSaleItem"
    DROP CONSTRAINT IF EXISTS "ServiceSaleItem_saleId_fkey";
EXCEPTION WHEN undefined_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE "ServiceSaleItem"
    ADD CONSTRAINT "ServiceSaleItem_tenant_sale_fkey"
      FOREIGN KEY ("tenantId", "saleId")
      REFERENCES "ServiceSale" ("tenantId", id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ServiceSaleItem: enforce cross-tenant catalog item integrity
DO $$ BEGIN
  ALTER TABLE "ServiceSaleItem"
    DROP CONSTRAINT IF EXISTS "ServiceSaleItem_catalogItemId_fkey";
EXCEPTION WHEN undefined_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE "ServiceSaleItem"
    ADD CONSTRAINT "ServiceSaleItem_tenant_catalogitem_fkey"
      FOREIGN KEY ("tenantId", "catalogItemId")
      REFERENCES "ServiceCatalogItem" ("tenantId", id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ServiceSale: enforce cross-tenant staff integrity (nullable, deferrable)
DO $$ BEGIN
  ALTER TABLE "ServiceSale"
    DROP CONSTRAINT IF EXISTS "ServiceSale_staffId_fkey";
EXCEPTION WHEN undefined_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE "ServiceSale"
    ADD CONSTRAINT "ServiceSale_tenant_staff_fkey"
      FOREIGN KEY ("tenantId", "staffId")
      REFERENCES "ServiceStaff" ("tenantId", id) ON DELETE SET NULL
      DEFERRABLE INITIALLY DEFERRED;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ServiceCheckoutRequest: enforce cross-tenant sale integrity
DO $$ BEGIN
  ALTER TABLE "ServiceCheckoutRequest"
    DROP CONSTRAINT IF EXISTS "ServiceCheckoutRequest_saleId_fkey";
EXCEPTION WHEN undefined_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE "ServiceCheckoutRequest"
    ADD CONSTRAINT "ServiceCheckoutRequest_tenant_sale_fkey"
      FOREIGN KEY ("tenantId", "saleId")
      REFERENCES "ServiceSale" ("tenantId", id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
