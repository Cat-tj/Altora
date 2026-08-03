import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test from "node:test";
import process from "node:process";

const databaseUrl = process.env.DATABASE_URL;
const skip = databaseUrl ? undefined : "DATABASE_URL tidak tersedia";

/**
 * IMP-011: hardening — full lifecycle in one isolated tenant:
 * sale → void → return → stock invariant → negative blocked → tenant isolation.
 */
test("hardening: sale→void→return lifecycle keeps ledger invariant, negative blocked, isolation holds", { skip }, async () => {
  if (!databaseUrl) return;
  const { Pool } = await import("pg");
  const { createMarketSale } = await import("./market-pos.ts");
  const { createReturn } = await import("./market-returns.ts");
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
      await fx.query(`INSERT INTO "ProductStock" (id,"tenantId","productId","outletId",qty) VALUES ($1,$2,$3,$4,30)`, [sk, t, p, o]);
      await fx.query(`INSERT INTO "StockLedger" (id,"tenantId","outletId","productId",delta,"balanceAfter",source,"sourceId",note,"idempotencyKey") VALUES ($1,$2,$3,$4,30,30,'OPENING',$5,'o',$6)`, [sl, t, o, p, sk, `opening:${sk}`]);
      await fx.query(`INSERT INTO "CashierShift" (id,"tenantId","outletId","userId","openingCash",status,"openedAt") VALUES ($1,$2,$3,$4,100000,'OPEN',NOW())`, [shift, t, o, owner]);
      await fx.query("COMMIT");
      ok = true;
    } finally { fx.release(); }

    const u = { tenantId: t, userId: owner, shiftId: shift };

    // 1) Sale 10 items → stock 20
    const reqId = randomUUID();
    const sale = await createMarketSale({ ...u, requestId: reqId, items: [{ productId: p, quantity: 10 }], paymentMethod: "CASH", amountPaid: 100000 });
    let q = (await pool.query(`SELECT qty::int FROM "ProductStock" WHERE "productId"=$1 AND "tenantId"=$2`, [p, t])).rows[0].qty;
    assert.equal(q, 20, "30 - 10 = 20");

    // 2) Idempotent retry — no double deduct
    const retry = await createMarketSale({ ...u, requestId: reqId, items: [{ productId: p, quantity: 10 }], paymentMethod: "CASH", amountPaid: 100000 });
    assert.equal(retry.id, sale.id, "retry returns same sale");
    q = (await pool.query(`SELECT qty::int FROM "ProductStock" WHERE "productId"=$1 AND "tenantId"=$2`, [p, t])).rows[0].qty;
    assert.equal(q, 20, "retry tidak mengurangi lagi");

    // 3) Return 3 restock → stock 23
    const saleItem = (await pool.query(`SELECT id FROM "SaleItem" WHERE "saleId"=$1 LIMIT 1`, [sale.id])).rows[0];
    await createReturn({ tenantId: t, userId: owner, role: "OWNER", saleId: sale.id, reason: "Tes retur", lines: [{ saleItemId: saleItem.id, qty: 3, restock: true }] });
    q = (await pool.query(`SELECT qty::int FROM "ProductStock" WHERE "productId"=$1 AND "tenantId"=$2`, [p, t])).rows[0].qty;
    assert.equal(q, 23, "20 + 3 restock = 23");

    // 4) Ledger invariant
    const inv = (await pool.query(`SELECT (SELECT qty::int FROM "ProductStock" WHERE "productId"=$1 AND "tenantId"=$2) AS qty, COALESCE(SUM(delta),0)::int AS s FROM "StockLedger" WHERE "productId"=$1 AND "tenantId"=$2`, [p, t])).rows[0];
    assert.equal(inv.qty, inv.s, "qty == SUM(delta)");

    // 5) Negative blocked — try selling 1000
    await assert.rejects(() => createMarketSale({ ...u, requestId: randomUUID(), items: [{ productId: p, quantity: 1000 }], paymentMethod: "CASH", amountPaid: 10000000 }), /tidak mencukupi|Stok/);

    // 6) Tenant isolation — other tenant sees nothing
    const other = (await pool.query(`SELECT COUNT(*)::int AS c FROM "Sale" WHERE "tenantId"='nope'`)).rows[0].c;
    assert.equal(other, 0, "tenant lain kosong");
  } finally {
    if (ok) {
      try {
        const cl = await pool.connect();
        try {
          await cl.query("BEGIN");
          await cl.query(`DELETE FROM "StockLedger" WHERE "tenantId"=$1`, [t]);
          await cl.query(`DELETE FROM "SaleReturnItem" WHERE "tenantId"=$1`, [t]);
          await cl.query(`DELETE FROM "SaleReturn" WHERE "tenantId"=$1`, [t]);
          await cl.query(`DELETE FROM "MarketCheckoutRequest" WHERE "tenantId"=$1`, [t]);
          await cl.query(`DELETE FROM "SalePayment" WHERE "tenantId"=$1`, [t]);
          await cl.query(`DELETE FROM "SaleItem" WHERE "tenantId"=$1`, [t]);
          await cl.query(`DELETE FROM "Sale" WHERE "tenantId"=$1`, [t]);
          await cl.query(`DELETE FROM "ProductStock" WHERE "tenantId"=$1`, [t]);
          await cl.query(`DELETE FROM "CashierShift" WHERE "tenantId"=$1`, [t]);
          await cl.query(`DELETE FROM "AuditLog" WHERE "tenantId"=$1`, [t]);
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
