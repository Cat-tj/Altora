import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test from "node:test";
import process from "node:process";

const databaseUrl = process.env.DATABASE_URL;
const skip = databaseUrl ? undefined : "DATABASE_URL tidak tersedia";

/**
 * IMP-006: receiving maturity — defect excluded, cancel DRAFT safe, double-complete blocked.
 * Fully isolated tenant, cleanup in finally.
 */
test("receiving: defect excluded from stock, cancel DRAFT safe, double-complete blocked", { skip }, async () => {
  if (!databaseUrl) return;
  const { Pool } = await import("pg");
  const { createReceipt, completeReceipt, cancelReceipt } = await import("./market-receiving.ts");
  const pool = new Pool({ connectionString: databaseUrl });

  const sfx = randomUUID().slice(0, 8);
  const t = `it_t_${sfx}`, outlet = `it_o_${sfx}`, owner = `it_u_${sfx}`;
  const p1 = `it_p1_${sfx}`, p2 = `it_p2_${sfx}`;
  const sk1 = `it_sk1_${sfx}`, sk2 = `it_sk2_${sfx}`;
  const sl1 = `it_sl1_${sfx}`, sl2 = `it_sl2_${sfx}`;
  const user = { tenantId: t, userId: owner, role: "OWNER" };
  let ok = false;

  try {
    const fx = await pool.connect();
    try {
      await fx.query("BEGIN");
      await fx.query(`INSERT INTO "Tenant" (id,name) VALUES ($1,'IT')`, [t]);
      await fx.query(`INSERT INTO "Outlet" (id,"tenantId",name,"isActive") VALUES ($1,$2,'O',true)`, [outlet, t]);
      await fx.query(`INSERT INTO "User" (id,"tenantId",name,email,"passwordHash",role,"isActive") VALUES ($1,$2,'U',$3,'x','OWNER',true)`, [owner, t, `u-${sfx}@t`]);
      await fx.query(`INSERT INTO "UserOutlet" (id,"tenantId","userId","outletId") VALUES ($1,$2,$3,$4)`, [`it_uo_${sfx}`, t, owner, outlet]);
      await fx.query(`INSERT INTO "Product" (id,"tenantId","categoryId",name,sku,price,kind,"trackStock","isActive") VALUES ($1,$2,NULL,'P1',$3,10000,'GOODS',true,true)`, [p1, t, `s1-${sfx}`]);
      await fx.query(`INSERT INTO "Product" (id,"tenantId","categoryId",name,sku,price,kind,"trackStock","isActive") VALUES ($1,$2,NULL,'P2',$3,5000,'GOODS',true,true)`, [p2, t, `s2-${sfx}`]);
      await fx.query(`INSERT INTO "ProductStock" (id,"tenantId","productId","outletId",qty) VALUES ($1,$2,$3,$4,10),($5,$2,$6,$4,0)`, [sk1, t, p1, outlet, sk2, p2]);
      await fx.query(`INSERT INTO "StockLedger" (id,"tenantId","outletId","productId",delta,"balanceAfter",source,"sourceId",note,"idempotencyKey") VALUES ($1,$2,$3,$4,10,10,'OPENING',$5,'o',$6),($7,$2,$3,$10,0,0,'OPENING',$8,'o2',$9)`, [sl1, t, outlet, p1, sk1, `opening:${sk1}`, sl2, sk2, `opening:${sk2}`, p2]);
      await fx.query("COMMIT");
      ok = true;
    } finally { fx.release(); }

    const v = await pool.connect();
    try {
      // ── 1) Create DRAFT with defect 2 — stock unchanged ──
      const draft = await createReceipt({ ...user, outletId: outlet, items: [{ productId: p1, qtyAccepted: 5, qtyDefect: 2 }] });
      assert.equal((await v.query(`SELECT qty::int FROM "ProductStock" WHERE "productId"=$1 AND "tenantId"=$2`, [p1, t])).rows[0].qty, 10, "draft: stok tidak berubah");

      // ── 2) Cancel DRAFT → still no stock ──
      await cancelReceipt({ ...user, receiptId: draft.id });
      const draftStatus = (await v.query(`SELECT status FROM "StockReceipt" WHERE id=$1`, [draft.id])).rows[0].status;
      assert.equal(draftStatus, "CANCELLED");
      assert.equal((await v.query(`SELECT qty::int FROM "ProductStock" WHERE "productId"=$1 AND "tenantId"=$2`, [p1, t])).rows[0].qty, 10, "cancel DRAFT: stok tetap");

      // ── 3) New receipt: complete → qtyAccepted adds, defect ignored ──
      const rc = await createReceipt({ ...user, outletId: outlet, items: [{ productId: p1, qtyAccepted: 5, qtyDefect: 3 }, { productId: p2, qtyAccepted: 7, qtyDefect: 0 }] });
      await completeReceipt({ ...user, receiptId: rc.id });
      assert.equal((await v.query(`SELECT qty::int FROM "ProductStock" WHERE "productId"=$1 AND "tenantId"=$2`, [p1, t])).rows[0].qty, 15, "complete: +5 accepted (defect 3 diabaikan)");
      assert.equal((await v.query(`SELECT qty::int FROM "ProductStock" WHERE "productId"=$1 AND "tenantId"=$2`, [p2, t])).rows[0].qty, 7, "complete: P2 +7");

      const ledger = (await v.query(`SELECT delta,source FROM "StockLedger" WHERE "productId"=$1 AND "tenantId"=$2 AND source='RECEIPT'`, [p1, t])).rows;
      assert.equal(ledger.length, 1);
      assert.equal(ledger[0].delta, 5, "ledger delta = qtyAccepted only");

      // ── 4) Double-complete blocked ──
      await assert.rejects(() => completeReceipt({ ...user, receiptId: rc.id }), /sudah diselesaikan/);

      // ── 5) Invariant ──
      for (const pid of [p1, p2]) {
        const r = (await v.query(`SELECT (SELECT qty::int FROM "ProductStock" WHERE "productId"=$1 AND "tenantId"=$2) AS qty, COALESCE(SUM(delta),0)::int AS s FROM "StockLedger" WHERE "productId"=$1 AND "tenantId"=$2`, [pid, t])).rows[0];
        assert.equal(r.qty, r.s, `invariant ${pid}`);
      }
    } finally { v.release(); }
  } finally {
    if (ok) {
      try {
        const cl = await pool.connect();
        try {
          await cl.query("BEGIN");
          await cl.query(`DELETE FROM "StockLedger" WHERE "tenantId"=$1`, [t]);
          await cl.query(`DELETE FROM "StockReceiptItem" WHERE "tenantId"=$1`, [t]);
          await cl.query(`DELETE FROM "StockReceipt" WHERE "tenantId"=$1`, [t]);
          await cl.query(`DELETE FROM "ProductStock" WHERE "tenantId"=$1`, [t]);
          await cl.query(`DELETE FROM "Product" WHERE id IN ($1,$2)`, [p1, p2]);
          await cl.query(`DELETE FROM "UserOutlet" WHERE "userId"=$1`, [owner]);
          await cl.query(`DELETE FROM "User" WHERE id=$1`, [owner]);
          await cl.query(`DELETE FROM "Outlet" WHERE id=$1`, [outlet]);
          await cl.query(`DELETE FROM "Tenant" WHERE id=$1`, [t]);
          await cl.query("COMMIT");
        } catch { try { await cl.query("ROLLBACK"); } catch { /* ignore */ } } finally { cl.release(); }
      } catch (e) { console.error("cleanup failed:", e.message); }
    }
    await pool.end();
  }
});
