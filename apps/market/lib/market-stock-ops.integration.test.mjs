import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test from "node:test";
import process from "node:process";

const databaseUrl = process.env.DATABASE_URL;
const skip = databaseUrl ? undefined : "DATABASE_URL tidak tersedia";

/**
 * IMP-005: integritas operasi stok — transfer, receiving, opname, negative stock.
 * Fully isolated: tenant sendiri, cleanup di finally.
 */
test("stock ops: transfer moves stock with ledger, receiving adds, opname adjusts, negative blocked", { skip }, async () => {
  if (!databaseUrl) return;
  const { Pool } = await import("pg");
  const { createStockTransfer } = await import("./market-stock-transfer.ts");
  const { createReceipt, completeReceipt } = await import("./market-receiving.ts");
  const { createStockCount, applyStockCount } = await import("./market-stock-count.ts");
  const pool = new Pool({ connectionString: databaseUrl });

  const suffix = randomUUID().slice(0, 8);
  const t = `it_t_${suffix}`;
  const o1 = `it_o1_${suffix}`;
  const o2 = `it_o2_${suffix}`;
  const owner = `it_own_${suffix}`;
  const product = `it_p_${suffix}`;
  const stock1 = `it_s1_${suffix}`;
  const stock2 = `it_s2_${suffix}`;
  const user = { tenantId: t, userId: owner, role: "OWNER" };
  let setupDone = false;

  try {
    const fx = await pool.connect();
    try {
      await fx.query("BEGIN");
      await fx.query(`INSERT INTO "Tenant" (id, name) VALUES ($1, 'IT Tenant')`, [t]);
      await fx.query(`INSERT INTO "Outlet" (id, "tenantId", name, "isActive") VALUES ($1, $2, 'IT Outlet A', true), ($3, $2, 'IT Outlet B', true)`, [o1, t, o2]);
      await fx.query(`INSERT INTO "User" (id, "tenantId", name, email, "passwordHash", role, "isActive") VALUES ($1, $2, 'IT Owner', $3, 'x', 'OWNER', true)`, [owner, t, `owner-${suffix}@it.test`]);
      await fx.query(`INSERT INTO "UserOutlet" (id, "tenantId", "userId", "outletId") VALUES ($1, $2, $3, $4), ($5, $2, $3, $6)`, [`it_uo1_${suffix}`, t, owner, o1, `it_uo2_${suffix}`, o2]);
      await fx.query(`INSERT INTO "Product" (id, "tenantId", "categoryId", name, sku, price, kind, "trackStock", "isActive") VALUES ($1, $2, NULL, 'IT Barang', $3, 10000, 'GOODS', true, true)`, [product, t, `SKU-${suffix}`]);
      await fx.query(`INSERT INTO "ProductStock" (id, "tenantId", "productId", "outletId", qty) VALUES ($1, $2, $3, $4, 10), ($5, $2, $3, $6, 0)`, [stock1, t, product, o1, stock2, o2]);
      await fx.query(`INSERT INTO "StockLedger" (id, "tenantId", "outletId", "productId", delta, "balanceAfter", source, "sourceId", note, "idempotencyKey") VALUES ($1, $2, $3, $4, 10, 10, 'OPENING', $5, 'IT opening A', $6), ($7, $2, $8, $4, 0, 0, 'OPENING', $9, 'IT opening B', $10)`, [`it_sl1_${suffix}`, t, o1, product, stock1, `opening:${stock1}`, `it_sl2_${suffix}`, o2, stock2, `opening:${stock2}`]);
      await fx.query("COMMIT");
      setupDone = true;
    } finally { fx.release(); }

    const v = await pool.connect();
    try {
      // ── 1) Transfer 3 pcs A→B ──
      const reqId = `it_req_${suffix}`;
      await createStockTransfer({ tenantId: t, fromOutletId: o1, toOutletId: o2, productId: product, qty: 3, createdById: owner, requestId: reqId });
      let rows = (await v.query(`SELECT qty::int FROM "ProductStock" WHERE "tenantId"=$1 AND "productId"=$2 AND "outletId"=$3`, [t, product, o1])).rows;
      assert.equal(rows[0].qty, 7, "outlet A berkurang 3");
      rows = (await v.query(`SELECT qty::int FROM "ProductStock" WHERE "tenantId"=$1 AND "productId"=$2 AND "outletId"=$3`, [t, product, o2])).rows;
      assert.equal(rows[0].qty, 3, "outlet B bertambah 3");

      const sources = (await v.query(`SELECT source FROM "StockLedger" WHERE "tenantId"=$1 AND "productId"=$2 ORDER BY "createdAt"`, [t, product])).rows.map((r) => r.source);
      assert.ok(sources.includes("TRANSFER_OUT"), "ada TRANSFER_OUT");
      assert.ok(sources.includes("TRANSFER_IN"), "ada TRANSFER_IN");
      const st = (await v.query(`SELECT status FROM "StockTransfer" WHERE "tenantId"=$1`, [t])).rows;
      assert.equal(st[0].status, "COMPLETED", "transfer COMPLETED");

      // ── 2) Idempotensi transfer: retry requestId sama tidak menggandakan ──
      await createStockTransfer({ tenantId: t, fromOutletId: o1, toOutletId: o2, productId: product, qty: 3, createdById: owner, requestId: reqId });
      const counts = (await v.query(`SELECT COUNT(*)::int AS c FROM "StockTransfer" WHERE "tenantId"=$1`, [t])).rows[0].c;
      const aQty = (await v.query(`SELECT qty::int FROM "ProductStock" WHERE "tenantId"=$1 AND "productId"=$2 AND "outletId"=$3`, [t, product, o1])).rows[0].qty;
      assert.equal(counts, 1, "retry tidak membuat transfer baru");
      assert.equal(aQty, 7, "retry tidak memindahkan ulang stok");

      // ── 3) Negative stock: transfer 99 dari A (sisa 7) → error ──
      await assert.rejects(() => createStockTransfer({ tenantId: t, fromOutletId: o1, toOutletId: o2, productId: product, qty: 99, createdById: owner }), /tidak mencukupi/);
      rows = (await v.query(`SELECT qty::int FROM "ProductStock" WHERE "tenantId"=$1 AND "productId"=$2 AND "outletId"=$3`, [t, product, o1])).rows;
      assert.equal(rows[0].qty, 7, "stok A tidak berubah setelah gagal");

      // ── 4) Receiving: +5 ke B ──
      const rc = await createReceipt({ ...user, outletId: o2, items: [{ productId: product, qtyAccepted: 5, qtyDefect: 0 }] });
      await completeReceipt({ ...user, receiptId: rc.id });
      rows = (await v.query(`SELECT qty::int FROM "ProductStock" WHERE "tenantId"=$1 AND "productId"=$2 AND "outletId"=$3`, [t, product, o2])).rows;
      assert.equal(rows[0].qty, 8, "outlet B +5 dari receiving");
      const rSources = (await v.query(`SELECT source FROM "StockLedger" WHERE "tenantId"=$1 AND "productId"=$2 AND "outletId"=$3`, [t, product, o2])).rows.map((r) => r.source);
      assert.ok(rSources.includes("RECEIPT"), "ledger punya RECEIPT");

      // ── 5) Opname: hitung B = 6 (dari 8) → adjust -2 ──
      const cc = await createStockCount({ ...user, outletId: o2, lines: [{ productId: product, countedQty: 6 }] });
      await applyStockCount({ ...user, countId: cc.id });
      rows = (await v.query(`SELECT qty::int FROM "ProductStock" WHERE "tenantId"=$1 AND "productId"=$2 AND "outletId"=$3`, [t, product, o2])).rows;
      assert.equal(rows[0].qty, 6, "opname adjust -2");
      const aSources = (await v.query(`SELECT source FROM "StockLedger" WHERE "tenantId"=$1 AND "productId"=$2 AND "outletId"=$3`, [t, product, o2])).rows.map((r) => r.source);
      assert.ok(aSources.includes("ADJUSTMENT"), "ledger punya ADJUSTMENT");

      // Invariant final: semua outlet qty == SUM(delta)
      for (const o of [o1, o2]) {
        const r = (await v.query(`SELECT (SELECT qty::int FROM "ProductStock" WHERE "tenantId"=$1 AND "productId"=$2 AND "outletId"=$3) AS qty, COALESCE(SUM(delta),0)::int AS sum FROM "StockLedger" WHERE "tenantId"=$1 AND "productId"=$2 AND "outletId"=$3`, [t, product, o])).rows[0];
        assert.equal(r.qty, r.sum, `ledger invariant akhir outlet ${o}`);
      }
    } finally { v.release(); }
  } finally {
    if (setupDone) {
      try {
        const cl = await pool.connect();
        try {
          await cl.query("BEGIN");
          await cl.query(`DELETE FROM "StockLedger" WHERE "tenantId"=$1`, [t]);
          await cl.query(`DELETE FROM "StockTransfer" WHERE "tenantId"=$1`, [t]);
          await cl.query(`DELETE FROM "StockCountItem" WHERE "countId" IN (SELECT id FROM "StockCount" WHERE "tenantId"=$1)`, [t]);
          await cl.query(`DELETE FROM "StockCount" WHERE "tenantId"=$1`, [t]);
          await cl.query(`DELETE FROM "StockReceiptItem" WHERE "receiptId" IN (SELECT id FROM "StockReceipt" WHERE "tenantId"=$1)`, [t]);
          await cl.query(`DELETE FROM "StockReceipt" WHERE "tenantId"=$1`, [t]);
          await cl.query(`DELETE FROM "ProductStock" WHERE "tenantId"=$1`, [t]);
          await cl.query(`DELETE FROM "Product" WHERE id=$1`, [product]);
          await cl.query(`DELETE FROM "UserOutlet" WHERE "userId"=$1`, [owner]);
          await cl.query(`DELETE FROM "User" WHERE id=$1`, [owner]);
          await cl.query(`DELETE FROM "Outlet" WHERE id IN ($1, $2)`, [o1, o2]);
          await cl.query(`DELETE FROM "Tenant" WHERE id=$1`, [t]);
          await cl.query("COMMIT");
        } catch { try { await cl.query("ROLLBACK"); } catch {} } finally { cl.release(); }
      } catch (e) { console.error("cleanup failed:", e.message); }
    }
    await pool.end();
  }
});
