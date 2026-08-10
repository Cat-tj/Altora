import { Client } from 'pg';
const c = new Client({ connectionString: process.env.DATABASE_URL });
await c.connect();

// Count how many products in DB for idm_tenant
const r = await c.query(`SELECT count(*) FROM "Product" WHERE "tenantId" = 'idm_tenant'`);
console.log(`Products in DB: ${r.rows[0].count}`);

// Check which categories have products
const cats = await c.query(`SELECT "categoryId", count(*) FROM "Product" WHERE "tenantId" = 'idm_tenant' GROUP BY "categoryId"`);
console.log('By category:', cats.rows);

// Try inserting product for ROKOK category  
try {
  await c.query(`INSERT INTO "Product" (id, "tenantId", "categoryId", name, sku, price, "trackStock", "isActive", "createdAt", "updatedAt", kind, "trackExpiry", "trackSerial") VALUES ('idm_p_test_rokok', 'idm_tenant', 'idm_c_rokok', 'Test Rokok', '8888888888', 25000, true, true, NOW(), NOW(), 'GOODS', false, false)`);
  console.log('ROKOK insert OK');
  await c.query(`DELETE FROM "Product" WHERE id = 'idm_p_test_rokok'`);
} catch(e) {
  console.log('ROKOK insert ERR:', e.message);
}

await c.end();
