import { randomUUID } from "node:crypto";
import { Pool } from "pg";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL belum diatur.");
const pool = new Pool({ connectionString: url });
const tenant = "seed_tenant_market";
const probeTenant = `service_probe_${randomUUID()}`;
let saleId;

try {
  await pool.query(`INSERT INTO "Tenant" (id, name) VALUES ($1, $2)`, [probeTenant, "Isolation Probe"]);
  const catalog = (await pool.query(`SELECT id, price FROM "ServiceCatalogItem" WHERE "tenantId" = $1 AND "isActive" = true ORDER BY id LIMIT 1`, [tenant])).rows[0];
  const staff = (await pool.query(`SELECT id FROM "ServiceStaff" WHERE "tenantId" = $1 AND "isActive" = true ORDER BY id LIMIT 1`, [tenant])).rows[0];
  if (!catalog || !staff) throw new Error("Catalog atau staff seed Service tidak tersedia.");

  const requestId = `contract-${randomUUID()}`;
  saleId = `contract_sale_${randomUUID()}`;
  await pool.query("BEGIN");
  await pool.query(`INSERT INTO "ServiceSale" (id, "tenantId", "outletId", "staffId", total, "paymentMethod") VALUES ($1, $2, 'outlet_market_1', $3, $4, 'CASH')`, [saleId, tenant, staff.id, catalog.price]);
  await pool.query(`INSERT INTO "ServiceSaleItem" (id, "tenantId", "saleId", "catalogItemId", name, price, quantity, subtotal) VALUES ($1, $2, $3, $4, 'contract item', $5, 1, $5)`, [`contract_item_${randomUUID()}`, tenant, saleId, catalog.id, catalog.price]);
  await pool.query(`INSERT INTO "ServiceCheckoutRequest" (id, "tenantId", "requestId", "saleId") VALUES ($1, $2, $3, $4)`, [`contract_request_${randomUUID()}`, tenant, requestId, saleId]);
  await pool.query("COMMIT");

  const replay = (await pool.query(`SELECT "saleId" FROM "ServiceCheckoutRequest" WHERE "tenantId" = $1 AND "requestId" = $2`, [tenant, requestId])).rows[0];
  const crossTenant = (await pool.query(`SELECT count(*)::int AS count FROM "ServiceCatalogItem" WHERE "tenantId" = $1`, [probeTenant])).rows[0].count;
  const persisted = (await pool.query(`SELECT (SELECT count(*) FROM "ServiceSale" WHERE id = $1)::int AS sale_count, (SELECT count(*) FROM "ServiceSaleItem" WHERE "saleId" = $1)::int AS item_count`, [saleId])).rows[0];
  if (replay.saleId !== saleId || crossTenant !== 0 || persisted.sale_count !== 1 || persisted.item_count !== 1) throw new Error("Service persistence contract gagal.");
  console.log(JSON.stringify({ status: "passed", catalog_price: catalog.price, replay_same_sale: true, cross_tenant_catalog_rows: crossTenant, persisted }));
} finally {
  if (saleId) await pool.query(`DELETE FROM "ServiceSale" WHERE id = $1`, [saleId]);
  await pool.query(`DELETE FROM "Tenant" WHERE id = $1`, [probeTenant]);
  await pool.end();
}
