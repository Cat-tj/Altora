import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test from "node:test";
import process from "node:process";

const databaseUrl = process.env.DATABASE_URL;
const skip = databaseUrl ? undefined : "DATABASE_URL tidak tersedia";

test("dashboard: reports sales totals after a sale", { skip }, async () => {
  if (!databaseUrl) return;
  const { Pool } = await import("pg");
  const { createMarketSale } = await import("./market-pos.ts");
  const { getMarketDashboard } = await import("./market-dashboard.ts");
  const pool = new Pool({ connectionString: databaseUrl });

  const sfx = randomUUID().slice(0, 8);
  const t = `it_t_${sfx}`, o = `it_o_${sfx}`, owner = `it_u_${sfx}`;
  const p = `it_p_${sfx}`, sk = `it_sk_${sfx}`, sl = `it_sl_${sfx}`, shift = `it_sh_${sfx}`;
  let ok = false;

  try {
    const fx = await pool.connect();
    try {
      await fx.query("BEGIN");
      await fx.query(`INSERT INTO "Tenant" (id,name) VALUES ($1,'IT')`, [t]);
      await fx.query(`INSERT INTO "Outlet" (id,"tenantId",name,"isActive") VALUES ($1,$2,'O',true)`, [o, t]);
      await fx.query(`INSERT INTO "User" (id,"tenantId",name,email,"passwordHash",role,"isActive") VALUES ($1,$2,'U',$3,'x','OWNER',true)`, [owner, t, `u-${sfx}@t`]);
      await fx.query(`INSERT INTO "UserOutlet" (id,"tenantId","userId","outletId") VALUES ($1,$2,$3,$4)`, [`it_uo_${sfx}`, t, owner, o]);
      await fx.query(`INSERT INTO "Product" (id,"tenantId","categoryId",name,sku,price,kind,"trackStock","isActive") VALUES ($1,$2,NULL,'P',$3,10000,'GOODS',true,true)`, [p, t, `s-${sfx}`]);
      await fx.query(`INSERT INTO "ProductStock" (id,"tenantId","productId","outletId",qty) VALUES ($1,$2,$3,$4,50)`, [sk, t, p, o]);
      await fx.query(`INSERT INTO "StockLedger" (id,"tenantId","outletId","productId",delta,"balanceAfter",source,"sourceId",note,"idempotencyKey") VALUES ($1,$2,$3,$4,50,50,'OPENING',$5,'o',$6)`, [sl, t, o, p, sk, `opening:${sk}`]);
      await fx.query(`INSERT INTO "CashierShift" (id,"tenantId","outletId","userId","openingCash",status,"openedAt") VALUES ($1,$2,$3,$4,100000,'OPEN',NOW())`, [shift, t, o, owner]);
      await fx.query("COMMIT");
      ok = true;
    } finally { fx.release(); }

    // Before: zero sales
    const before = await getMarketDashboard({ tenantId: t, userId: owner, role: "OWNER" });
    assert.equal(before.todaySales, 0, "belum ada penjualan");

    // 3 sales of 2×10000 = 20000 each
    for (let i = 0; i < 3; i++) {
      await createMarketSale({ tenantId: t, userId: owner, shiftId: shift, requestId: randomUUID(), items: [{ productId: p, quantity: 2 }], paymentMethod: "CASH", amountPaid: 20000 });
    }

    const after = await getMarketDashboard({ tenantId: t, userId: owner, role: "OWNER" });
    assert.equal(after.transactionCount, 3, "3 penjualan hari ini");
    assert.equal(after.todaySales, 60000, "total 3 × 20000");
  } finally {
    if (ok) {
      try {
        const cl = await pool.connect();
        try {
          await cl.query("BEGIN");
          await cl.query(`DELETE FROM "StockLedger" WHERE "tenantId"=$1`, [t]);
          await cl.query(`DELETE FROM "MarketCheckoutRequest" WHERE "tenantId"=$1`, [t]);
          await cl.query(`DELETE FROM "SalePayment" WHERE "tenantId"=$1`, [t]);
          await cl.query(`DELETE FROM "SaleItem" WHERE "tenantId"=$1`, [t]);
          await cl.query(`DELETE FROM "Sale" WHERE "tenantId"=$1`, [t]);
          await cl.query(`DELETE FROM "ProductStock" WHERE "tenantId"=$1`, [t]);
          await cl.query(`DELETE FROM "CashierShift" WHERE "tenantId"=$1`, [t]);
          await cl.query(`DELETE FROM "Product" WHERE id=$1`, [p]);
          await cl.query(`DELETE FROM "UserOutlet" WHERE "userId"=$1`, [owner]);
          await cl.query(`DELETE FROM "User" WHERE id=$1`, [owner]);
          await cl.query(`DELETE FROM "Outlet" WHERE id=$1`, [o]);
          await cl.query(`DELETE FROM "Tenant" WHERE id=$1`, [t]);
          await cl.query("COMMIT");
        } catch { try { await cl.query("ROLLBACK"); /* ignore */ } catch { /* ignore */ } } finally { cl.release(); }
      } catch (e) { console.error("cleanup failed:", e.message); }
    }
    await pool.end();
  }
});
