import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test from "node:test";
import process from "node:process";

const databaseUrl = process.env.DATABASE_URL;
const skip = databaseUrl ? undefined : "DATABASE_URL tidak tersedia";

/**
 * IMP-008: returns with restock (RETURN ledger) and no-restock (defect).
 * Sale has 2 products → 2 distinct sale items → 2 return lines.
 */
test("returns: restock adds stock via RETURN ledger, no-restock skips stock, over-return blocked", { skip }, async () => {
  if (!databaseUrl) return;
  const { Pool } = await import("pg");
  const { createMarketSale } = await import("./market-pos.ts");
  const { createReturn } = await import("./market-returns.ts");
  const pool = new Pool({ connectionString: databaseUrl });

  const sfx = randomUUID().slice(0, 8);
  const t = `it_t_${sfx}`, o = `it_o_${sfx}`, owner = `it_u_${sfx}`;
  const p1 = `it_p1_${sfx}`, p2 = `it_p2_${sfx}`;
  const sk1 = `it_sk1_${sfx}`, sk2 = `it_sk2_${sfx}`;
  const sl1 = `it_sl1_${sfx}`, sl2 = `it_sl2_${sfx}`, shift = `it_sh_${sfx}`;
  let ok = false;

  try {
    const fx = await pool.connect();
    try {
      await fx.query("BEGIN");
      await fx.query(`INSERT INTO "Tenant" (id,name) VALUES ($1,'IT')`, [t]);
      await fx.query(`INSERT INTO "Outlet" (id,"tenantId",name,"isActive") VALUES ($1,$2,'O',true)`, [o, t]);
      await fx.query(`INSERT INTO "User" (id,"tenantId",name,email,"passwordHash",role,"isActive") VALUES ($1,$2,'U',$3,'x','OWNER',true)`, [owner, t, `u-${sfx}@t`]);
      await fx.query(`INSERT INTO "UserOutlet" (id,"tenantId","userId","outletId") VALUES ($1,$2,$3,$4)`, [`it_uo_${sfx}`, t, owner, o]);
      await fx.query(`INSERT INTO "Product" (id,"tenantId","categoryId",name,sku,price,kind,"trackStock","isActive") VALUES ($1,$2,NULL,'P1',$3,10000,'GOODS',true,true),($4,$2,NULL,'P2',$5,5000,'GOODS',true,true)`, [p1, t, `s1-${sfx}`, p2, `s2-${sfx}`]);
      await fx.query(`INSERT INTO "ProductStock" (id,"tenantId","productId","outletId",qty) VALUES ($1,$2,$3,$4,20),($5,$2,$6,$4,20)`, [sk1, t, p1, o, sk2, p2]);
      await fx.query(`INSERT INTO "StockLedger" (id,"tenantId","outletId","productId",delta,"balanceAfter",source,"sourceId",note,"idempotencyKey") VALUES ($1,$2,$3,$4,20,20,'OPENING',$5,'o',$6),($7,$2,$3,$8,20,20,'OPENING',$9,'o2',$10)`, [sl1, t, o, p1, sk1, `opening:${sk1}`, sl2, p2, sk2, `opening:${sk2}`]);
      await fx.query(`INSERT INTO "CashierShift" (id,"tenantId","outletId","userId","openingCash",status,"openedAt") VALUES ($1,$2,$3,$4,100000,'OPEN',NOW())`, [shift, t, o, owner]);
      await fx.query("COMMIT");
      ok = true;
    } finally { fx.release(); }

    // Sale: 5×P1 + 5×P2 (stock → 15/15)
    const sale = await createMarketSale({ tenantId: t, userId: owner, shiftId: shift, requestId: randomUUID(), items: [{ productId: p1, quantity: 5 }, { productId: p2, quantity: 5 }], paymentMethod: "CASH", amountPaid: 75000 });
    assert.equal((await pool.query(`SELECT qty::int FROM "ProductStock" WHERE "productId"=$1 AND "tenantId"=$2`, [p1, t])).rows[0].qty, 15);
    assert.equal((await pool.query(`SELECT qty::int FROM "ProductStock" WHERE "productId"=$1 AND "tenantId"=$2`, [p2, t])).rows[0].qty, 15);

    // Get sale items
    const items = (await pool.query(`SELECT id,"productId" FROM "SaleItem" WHERE "saleId"=$1`, [sale.id])).rows;
    const itemP1 = items.find((i) => i.productId === p1);
    const itemP2 = items.find((i) => i.productId === p2);
    assert.ok(itemP1 && itemP2, "2 sale items");

    // Return: 2×P1 restock + 1×P2 no-restock (defect)
    const ret = await createReturn({ tenantId: t, userId: owner, role: "OWNER", saleId: sale.id, reason: "Barang rusak sebagian", lines: [{ saleItemId: itemP1.id, qty: 2, restock: true }, { saleItemId: itemP2.id, qty: 1, restock: false }] });
    assert.equal(ret.restockCount, 2, "restockCount = 2");
    assert.equal(ret.refundAmount, 25000, "refund = 2×10000 + 1×5000");

    // P1 +2 (15→17), P2 unchanged (15)
    assert.equal((await pool.query(`SELECT qty::int FROM "ProductStock" WHERE "productId"=$1 AND "tenantId"=$2`, [p1, t])).rows[0].qty, 17, "P1 +2 restock");
    assert.equal((await pool.query(`SELECT qty::int FROM "ProductStock" WHERE "productId"=$1 AND "tenantId"=$2`, [p2, t])).rows[0].qty, 15, "P2 no-restock");

    // Ledger RETURN only for P1, delta=2
    const retLedger = (await pool.query(`SELECT delta FROM "StockLedger" WHERE "productId"=$1 AND "tenantId"=$2 AND source='RETURN'`, [p1, t])).rows;
    assert.equal(retLedger.length, 1);
    assert.equal(retLedger[0].delta, 2);
    assert.equal((await pool.query(`SELECT COUNT(*)::int AS c FROM "StockLedger" WHERE "productId"=$1 AND "tenantId"=$2 AND source='RETURN'`, [p2, t])).rows[0].c, 0, "P2 tidak ada RETURN");

    // Over-return blocked
    await assert.rejects(() => createReturn({ tenantId: t, userId: owner, role: "OWNER", saleId: sale.id, reason: "Coba return melebihi", lines: [{ saleItemId: itemP1.id, qty: 100, restock: true }] }), /hanya bisa diretur/);

    // Invariants
    for (const pid of [p1, p2]) {
      const r = (await pool.query(`SELECT (SELECT qty::int FROM "ProductStock" WHERE "productId"=$1 AND "tenantId"=$2) AS qty, COALESCE(SUM(delta),0)::int AS s FROM "StockLedger" WHERE "productId"=$1 AND "tenantId"=$2`, [pid, t])).rows[0];
      assert.equal(r.qty, r.s, `invariant ${pid}`);
    }
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
          await cl.query(`DELETE FROM "Product" WHERE id IN ($1,$2)`, [p1, p2]);
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
