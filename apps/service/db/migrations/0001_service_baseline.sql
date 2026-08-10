-- Altora Service catalog and staff persistence.
-- Service membutuhkan platform tenant baseline pada database yang sama.
INSERT INTO "Tenant" (id, name) VALUES ('seed_tenant_market', 'Altora Service Demo')
ON CONFLICT (id) DO NOTHING;
DO $$ BEGIN
  CREATE TYPE "ServiceItemType" AS ENUM ('SERVICE', 'RETAIL');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS "ServiceCatalogItem" (
  id text PRIMARY KEY,
  "tenantId" text NOT NULL REFERENCES "Tenant"(id) ON DELETE CASCADE,
  name text NOT NULL,
  category text NOT NULL,
  price integer NOT NULL CHECK (price >= 0),
  "durationMinutes" integer NOT NULL DEFAULT 0 CHECK ("durationMinutes" >= 0),
  "itemType" "ServiceItemType" NOT NULL DEFAULT 'SERVICE',
  "isActive" boolean NOT NULL DEFAULT true,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "ServiceCatalogItem_tenant_active_idx"
  ON "ServiceCatalogItem" ("tenantId", "isActive");

CREATE TABLE IF NOT EXISTS "ServiceStaff" (
  id text PRIMARY KEY,
  "tenantId" text NOT NULL REFERENCES "Tenant"(id) ON DELETE CASCADE,
  "userId" text REFERENCES "User"(id) ON DELETE SET NULL,
  name text NOT NULL,
  "isActive" boolean NOT NULL DEFAULT true,
  "createdAt" timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "ServiceStaff_tenant_active_idx"
  ON "ServiceStaff" ("tenantId", "isActive");

CREATE TABLE IF NOT EXISTS "ServiceSale" (
  id text PRIMARY KEY,
  "tenantId" text NOT NULL REFERENCES "Tenant"(id) ON DELETE CASCADE,
  "staffId" text REFERENCES "ServiceStaff"(id) ON DELETE SET NULL,
  total integer NOT NULL CHECK (total >= 0),
  "paymentMethod" text NOT NULL,
  "createdAt" timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS "ServiceSaleItem" (
  id text PRIMARY KEY,
  "tenantId" text NOT NULL REFERENCES "Tenant"(id) ON DELETE CASCADE,
  "saleId" text NOT NULL REFERENCES "ServiceSale"(id) ON DELETE CASCADE,
  "catalogItemId" text NOT NULL REFERENCES "ServiceCatalogItem"(id),
  name text NOT NULL,
  price integer NOT NULL,
  quantity integer NOT NULL CHECK (quantity > 0),
  subtotal integer NOT NULL
);
CREATE TABLE IF NOT EXISTS "ServiceCheckoutRequest" (
  id text PRIMARY KEY,
  "tenantId" text NOT NULL REFERENCES "Tenant"(id) ON DELETE CASCADE,
  "requestId" text NOT NULL,
  "saleId" text NOT NULL REFERENCES "ServiceSale"(id) ON DELETE CASCADE,
  CONSTRAINT "ServiceCheckoutRequest_tenant_request_key" UNIQUE ("tenantId", "requestId")
);
CREATE INDEX IF NOT EXISTS "ServiceSale_tenant_created_idx"
  ON "ServiceSale" ("tenantId", "createdAt" DESC);

INSERT INTO "ServiceCatalogItem" (id, "tenantId", name, category, price, "durationMinutes", "itemType")
SELECT 'service_seed_' || x.id, t.id, x.name, x.category, x.price, x.duration, x.kind::"ServiceItemType"
FROM "Tenant" t
CROSS JOIN (VALUES
  ('haircut', 'Gentleman Haircut', 'Barber', 60000, 30, 'SERVICE'),
  ('coloring', 'Hair Coloring Premium', 'Chemical', 150000, 60, 'SERVICE'),
  ('massage', 'Scalp Massage & Wash', 'Treatment', 40000, 20, 'SERVICE'),
  ('pomade', 'Matte Clay Pomade 100g', 'Product', 85000, 0, 'RETAIL'),
  ('tonic', 'Nourishing Hair Tonic', 'Product', 65000, 0, 'RETAIL')
) AS x(id, name, category, price, duration, kind)
WHERE t.id = 'seed_tenant_market'
ON CONFLICT (id) DO NOTHING;

INSERT INTO "ServiceStaff" (id, "tenantId", name)
SELECT x.id, t.id, x.name
FROM "Tenant" t
CROSS JOIN (VALUES ('service_staff_1', 'Budi (Kapster Senior)'), ('service_staff_2', 'Andi (Colorist Expert)')) AS x(id, name)
WHERE t.id = 'seed_tenant_market'
ON CONFLICT (id) DO NOTHING;
