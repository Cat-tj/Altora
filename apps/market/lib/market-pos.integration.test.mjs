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
      const tenant = (await client.query(`SELECT t.id FROM "Tenant" t WHERE EXISTS (SELECT 1 FROM "User" u WHERE u."tenantId" = t.id AND u.role = 'OWNER' AND NOT EXISTS (SELECT 1 FROM "CashierShift" cs WHERE cs."tenantId" = u."tenantId" AND cs."userId" = u.id AND cs.status = 'OPEN')) AND EXISTS (SELECT 1 FROM "Outlet" o WHERE o."tenantId" = t.id AND o."isActive") AND EXISTS (SELECT 1 FROM "Product" p INNER JOIN "ProductStock" ps ON ps."productId" = p.id AND ps."tenantId" = p."tenantId" INNER JOIN "Outlet" o ON o.id = ps."outletId" AND o."tenantId" = ps."tenantId" WHERE p."tenantId" = t.id AND p.kind = 'GOODS' AND p."isActive" = true AND p."trackStock" = true AND ps.qty >= 2 AND o."isActive" = true) ORDER BY t."createdAt" LIMIT 1`)).rows[0];
      assert.ok(tenant?.id, "tenant test harus tersedia");
      const owner = (await client.query(`SELECT u.id FROM "User" u WHERE u."tenantId" = $1 AND u.role = 'OWNER' AND NOT EXISTS (SELECT 1 FROM "CashierShift" cs WHERE cs."tenantId" = u."tenantId" AND cs."userId" = u.id AND cs.status = 'OPEN') ORDER BY u."createdAt" LIMIT 1`, [tenant.id])).rows[0];
      const outlet = (await client.query(`SELECT o.id FROM "Outlet" o WHERE o."tenantId" = $1 AND o."isActive" = true AND EXISTS (SELECT 1 FROM "Product" p INNER JOIN "ProductStock" ps ON ps."productId" = p.id AND ps."tenantId" = p."tenantId" AND ps."outletId" = o.id WHERE p."tenantId" = o."tenantId" AND p.kind = 'GOODS' AND p."isActive" = true AND p."trackStock" = true AND ps.qty >= 2) ORDER BY o."createdAt" LIMIT 1`, [tenant.id])).rows[0];
      const product = (await client.query(`SELECT p.id, p.price, ps.qty FROM "Product" p INNER JOIN "ProductStock" ps ON ps."productId" = p.id AND ps."tenantId" = p."tenantId" AND ps."outletId" = $2 WHERE p."tenantId" = $1 AND p.kind = 'GOODS' AND p."isActive" = true AND p."trackStock" = true AND ps.qty >= 2 LIMIT 1`, [tenant.id, outlet.id])).rows[0];
      assert.ok(owner?.id && outlet?.id && product?.id, "data retail test harus tersedia");
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
