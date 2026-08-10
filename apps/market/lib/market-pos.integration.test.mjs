import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test from "node:test";
import process from "node:process";

const databaseUrl = process.env.DATABASE_URL;

test("checkout is idempotent, changes stock once, void restores stock, and shift closes", { skip: databaseUrl ? undefined : "DATABASE_URL tidak tersedia" }, async () => {
  if (!databaseUrl) return;
  const { Pool } = await import("pg");
  const { createMarketSale, closeMarketShift, getMarketShiftSummary, openMarketShift, voidMarketSale } = await import("./market-pos.ts");
  const pool = new Pool({ connectionString: databaseUrl });
  try {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const suffix = randomUUID().slice(0, 8);
      const tenant = { id: `t_${suffix}` };
      const owner = { id: `u_${suffix}` };
      const outlet = { id: `o_${suffix}` };
      const product = { id: `p_${suffix}`, price: 10000, qty: 10 };

      await client.query(`INSERT INTO "Tenant" (id, name) VALUES ($1, 'Test Tenant')`, [tenant.id]);
      await client.query(`INSERT INTO "Outlet" (id, "tenantId", name, "isActive", "createdAt") VALUES ($1, $2, 'Test Outlet', true, NOW())`, [outlet.id, tenant.id]);
      await client.query(`INSERT INTO "User" (id, "tenantId", name, email, "passwordHash", role) VALUES ($1, $2, 'Test Owner', $3, 'hash', 'OWNER')`, [owner.id, tenant.id, `owner-${suffix}@test.com`]);
      await client.query(`INSERT INTO "UserOutlet" (id, "tenantId", "userId", "outletId") VALUES ($1, $2, $3, $4)`, [`uo_${suffix}`, tenant.id, owner.id, outlet.id]);
      await client.query(`INSERT INTO "Category" (id, "tenantId", name) VALUES ($1, $2, 'Test Category')`, [`cat_${suffix}`, tenant.id]);
      await client.query(`INSERT INTO "Product" (id, "tenantId", "categoryId", name, price, kind, "isActive", "trackStock") VALUES ($1, $2, $3, 'Test Product', $4, 'GOODS', true, true)`, [product.id, tenant.id, `cat_${suffix}`, product.price]);
      await client.query(`INSERT INTO "ProductStock" (id, "tenantId", "outletId", "productId", qty) VALUES ($1, $2, $3, $4, $5)`, [`ps_${suffix}`, tenant.id, outlet.id, product.id, product.qty]);
      await client.query("COMMIT");
      const user = { tenantId: tenant.id, userId: owner.id, role: "OWNER" };
      const shift = await openMarketShift({ ...user, outletId: outlet.id, openingCash: 1_000 });
      const requestId = randomUUID();
      const first = await createMarketSale({ tenantId: tenant.id, userId: owner.id, shiftId: shift.id, requestId, items: [{ productId: product.id, quantity: 1 }], paymentMethod: "CASH", amountPaid: Number(product.price) + 1_000 });
      const second = await createMarketSale({ tenantId: tenant.id, userId: owner.id, shiftId: shift.id, requestId, items: [{ productId: product.id, quantity: 1 }], paymentMethod: "CASH", amountPaid: Number(product.price) + 1_000 });
      assert.equal(second.id, first.id);
      assert.equal(second.reused, true);
      const afterSale = await client.query(`SELECT qty FROM "ProductStock" WHERE "tenantId" = $1 AND "outletId" = $2 AND "productId" = $3`, [tenant.id, outlet.id, product.id]);
      assert.equal(Number(afterSale.rows[0].qty), Number(product.qty) - 1);
      const summary = await getMarketShiftSummary({ tenantId: tenant.id, userId: owner.id, shiftId: shift.id });
      assert.equal(summary?.expectedCash, 1_000 + Number(product.price));
      await assert.rejects(
        () => voidMarketSale({ ...user, saleId: first.id, reason: "a".repeat(501) }),
        /maksimal 500 karakter/,
      );
      await voidMarketSale({ ...user, saleId: first.id, reason: "Uji integrasi rollback" });
      const afterVoid = await client.query(`SELECT qty FROM "ProductStock" WHERE "tenantId" = $1 AND "outletId" = $2 AND "productId" = $3`, [tenant.id, outlet.id, product.id]);
      assert.equal(Number(afterVoid.rows[0].qty), Number(product.qty));
      await assert.rejects(
        () => closeMarketShift({ tenantId: tenant.id, userId: owner.id, shiftId: shift.id, closingCash: 1_000, varianceNote: "a".repeat(501) }),
        /maksimal 500 karakter/,
      );
      const closed = await closeMarketShift({ tenantId: tenant.id, userId: owner.id, shiftId: shift.id, closingCash: 1_000 });
      assert.equal(closed.expectedCash, 1_000);
    } finally {
      await client.query("ROLLBACK");
      client.release();
    }
  } finally { await pool.end(); }
});
