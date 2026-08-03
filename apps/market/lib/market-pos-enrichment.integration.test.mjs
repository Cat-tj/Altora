import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test from "node:test";
import process from "node:process";

const databaseUrl = process.env.DATABASE_URL;
const skip = databaseUrl ? undefined : "DATABASE_URL tidak tersedia";

/**
 * POS enrichment: varian, split payment, deposit member, poin.
 * Fully isolated: membuat tenant/outlet/user/product/stock sendiri (id unik),
 * tidak menyentuh data seed — aman dijalankan paralel/serial dengan test lain.
 * Cleanup selalu di finally.
 */
test("POS enrichment: varian, split, deposit, poin", { skip }, async () => {
  if (!databaseUrl) return;
  const { Pool } = await import("pg");
  const { createMarketSale, listMarketPosProducts } = await import("./market-pos.ts");
  const pool = new Pool({ connectionString: databaseUrl });

  const suffix = randomUUID().slice(0, 8);
  const t = `it_tenant_${suffix}`;
  const outlet = `it_outlet_${suffix}`;
  const owner = `it_owner_${suffix}`;
  const product = `it_prod_${suffix}`;
  const member = `it_mem_${suffix}`;
  const group = `it_grp_${suffix}`;
  const optL = `it_optl_${suffix}`;
  const optM = `it_optm_${suffix}`;
  const shift = `it_shift_${suffix}`;
  const stock = `it_stock_${suffix}`;
  const BASE_PRICE = 50_000;
  const INITIAL_QTY = 20;
  const saleIds = [];
  let setupDone = false;

  try {
    // ── Fixture (committed): tenant sendiri, tidak menyentuh seed ──
    const fx = await pool.connect();
    try {
      await fx.query("BEGIN");
      await fx.query(`INSERT INTO "Tenant" (id, name) VALUES ($1, 'IT Tenant')`, [t]);
      await fx.query(`INSERT INTO "Outlet" (id, "tenantId", name, "isActive") VALUES ($1, $2, 'IT Outlet', true)`, [outlet, t]);
      await fx.query(`INSERT INTO "User" (id, "tenantId", name, email, "passwordHash", role, "isActive") VALUES ($1, $2, 'IT Owner', $3, 'x', 'OWNER', true)`, [owner, t, `owner-${suffix}@it.test`]);
      await fx.query(`INSERT INTO "UserOutlet" (id, "tenantId", "userId", "outletId") VALUES ($1, $2, $3, $4)`, [`it_uo_${suffix}`, t, owner, outlet]);
      await fx.query(`INSERT INTO "Product" (id, "tenantId", "categoryId", name, sku, price, kind, "trackStock", "isActive") VALUES ($1, $2, NULL, 'IT Produk', $3, $4, 'GOODS', true, true)`, [product, t, `SKU-${suffix}`, BASE_PRICE]);
      await fx.query(`INSERT INTO "ProductStock" (id, "tenantId", "productId", "outletId", qty) VALUES ($1, $2, $3, $4, $5)`, [stock, t, product, outlet, INITIAL_QTY]);
      await fx.query(`INSERT INTO "ProductStock" (id, "tenantId", "productId", "outletId", qty) SELECT $1, $2, $3, o.id, 0 FROM "Outlet" o WHERE o."tenantId" = $2 AND o.id <> $4`, [`it_stock2_${suffix}`, t, product, outlet]);
      // StockLedger OPENING untuk invariant qty == SUM(delta)
      await fx.query(`INSERT INTO "StockLedger" (id, "tenantId", "outletId", "productId", delta, "balanceAfter", source, "sourceId", note, "idempotencyKey") VALUES ($1, $2, $3, $4, $5, $5, 'OPENING', $6, 'IT opening', $7)`, [`it_sl_${suffix}`, t, outlet, product, INITIAL_QTY, stock, `opening:${stock}`]);
      await fx.query(`INSERT INTO "ProductVariantGroup" (id, "tenantId", "productId", name, type, required, "sortOrder") VALUES ($1, $2, $3, 'Ukuran', 'SINGLE', true, 0)`, [group, t, product]);
      await fx.query(`INSERT INTO "ProductVariantOption" (id, "tenantId", "variantGroupId", name, "priceDelta", "sortOrder") VALUES ($1, $2, $3, 'Large', 5000, 0), ($4, $2, $3, 'Medium', 0, 1)`, [optL, t, group, optM]);
      await fx.query(`INSERT INTO "Member" (id, "tenantId", name, phone, "depositBalance", points) VALUES ($1, $2, 'IT Member', $3, 100000, 0)`, [member, t, `08${suffix}${suffix}`]);
      await fx.query(`INSERT INTO "CashierShift" (id, "tenantId", "outletId", "userId", "openingCash", status, "openedAt") VALUES ($1, $2, $3, $4, 100000, 'OPEN', NOW())`, [shift, t, outlet, owner]);
      await fx.query("COMMIT");
      setupDone = true;
    } finally { fx.release(); }

    const u = { tenantId: t, userId: owner, shiftId: shift };
    const variantPrice = BASE_PRICE + 5000;

    // 1) Sale varian: harga = base + delta, label tersimpan
    const rid1 = randomUUID();
    const sale = await createMarketSale({ ...u, requestId: rid1, items: [{ productId: product, quantity: 2, variantOptionIds: [optL] }], paymentMethod: "CASH", amountPaid: variantPrice * 2 });
    saleIds.push(sale.id);
    assert.equal(sale.reused, false);

    // 2) Idempotensi: requestId sama → sale sama, sekali saja
    const retry = await createMarketSale({ ...u, requestId: rid1, items: [{ productId: product, quantity: 2, variantOptionIds: [optL] }], paymentMethod: "CASH", amountPaid: variantPrice * 2 });
    assert.equal(retry.id, sale.id, "idempotency: same requestId returns same sale");
    assert.equal(retry.reused, true);

    // 3) Split payment CASH + QRIS
    const splitSale = await createMarketSale({ ...u, requestId: randomUUID(), items: [{ productId: product, quantity: 1, variantOptionIds: [optL] }], payments: [{ method: "CASH", amount: Math.floor(variantPrice / 2) }, { method: "QRIS", amount: variantPrice - Math.floor(variantPrice / 2) }] });
    saleIds.push(splitSale.id);

    // 4) Deposit + poin
    const depSale = await createMarketSale({ ...u, requestId: randomUUID(), items: [{ productId: product, quantity: 1, variantOptionIds: [optL] }], memberId: member, payments: [{ method: "DEPOSIT", amount: variantPrice }] });
    saleIds.push(depSale.id);

    // Verifikasi
    const v = await pool.connect();
    try {
      const items = (await v.query(`SELECT price::int,qty,"variantLabel","variantPriceDelta"::int FROM "SaleItem" WHERE "saleId"=$1`, [sale.id])).rows;
      assert.equal(items[0].price, variantPrice, "item price = base + delta");
      assert.equal(items[0].variantLabel, "Large");
      assert.equal(items[0].variantPriceDelta, 5000);
      assert.equal(items[0].qty, 2);

      const ledgerSum = (await v.query(`SELECT COALESCE(SUM(delta),0)::int AS s FROM "StockLedger" WHERE "tenantId"=$1 AND "outletId"=$2 AND "productId"=$3`, [t, outlet, product])).rows[0].s;
      const curQty = (await v.query(`SELECT qty::int FROM "ProductStock" WHERE "tenantId"=$1 AND "outletId"=$2 AND "productId"=$3`, [t, outlet, product])).rows[0].qty;
      assert.equal(curQty, ledgerSum, "ledger invariant: qty == SUM(delta)");
      assert.equal(curQty, INITIAL_QTY - 4, "stock reduced by 2+1+1=4");

      const splitRows = (await v.query(`SELECT method,amount::int FROM "SalePayment" WHERE "saleId"=$1 ORDER BY method`, [splitSale.id])).rows;
      assert.equal(splitRows.length, 2);
      assert.equal(splitRows.reduce((s, r) => s + r.amount, 0), variantPrice);

      const m = (await v.query(`SELECT "depositBalance"::int AS bal,points::int AS pts FROM "Member" WHERE id=$1`, [member])).rows[0];
      assert.equal(m.bal, 100000 - variantPrice);
      assert.equal(m.pts, Math.floor(variantPrice / 1000));

      const pt = (await v.query(`SELECT type,"saleId" FROM "PointTransaction" WHERE "memberId"=$1`, [member])).rows;
      assert.equal(pt.length, 1);
      assert.equal(pt[0].saleId, depSale.id);

      const audit = (await v.query(`SELECT action FROM "AuditLog" WHERE "tenantId"=$1 AND action IN ('MEMBER_DEPOSIT_DEBIT','MEMBER_POINTS_EARN')`, [t])).rows;
      assert.ok(audit.some(r => r.action === "MEMBER_DEPOSIT_DEBIT"), "deposit audit");
      assert.ok(audit.some(r => r.action === "MEMBER_POINTS_EARN"), "points audit");

      const products = await listMarketPosProducts({ tenantId: t, outletId: outlet });
      const p = products.find(p => p.id === product);
      assert.ok(p?.variantGroups.find(g => g.id === group && g.options.length === 2), "variants in catalog");

      // 5) Deposit tidak cukup: saldo 1, bayar total persis → balance check fires
      await v.query(`UPDATE "Member" SET "depositBalance" = 1 WHERE id = $1`, [member]);
    } finally { v.release(); }

    await assert.rejects(() => createMarketSale({ ...u, requestId: randomUUID(), items: [{ productId: product, quantity: 1, variantOptionIds: [optL] }], memberId: member, payments: [{ method: "DEPOSIT", amount: variantPrice }] }), /tidak cukup/);
  } finally {
    if (setupDone) {
      try {
        const cl = await pool.connect();
        try {
          await cl.query("BEGIN");
          if (saleIds.length) {
            await cl.query(`DELETE FROM "StockLedger" WHERE "sourceId"=ANY($1::text[])`, [saleIds]);
            await cl.query(`DELETE FROM "MarketCheckoutRequest" WHERE "saleId"=ANY($1::text[])`, [saleIds]);
            await cl.query(`DELETE FROM "SalePayment" WHERE "saleId"=ANY($1::text[])`, [saleIds]);
            await cl.query(`DELETE FROM "SaleItem" WHERE "saleId"=ANY($1::text[])`, [saleIds]);
            await cl.query(`DELETE FROM "PointTransaction" WHERE "memberId"=$1`, [member]);
            await cl.query(`DELETE FROM "AuditLog" WHERE "tenantId"=$1 AND action IN ('MEMBER_DEPOSIT_DEBIT','MEMBER_POINTS_EARN')`, [t]);
            await cl.query(`DELETE FROM "Sale" WHERE id=ANY($1::text[])`, [saleIds]);
          }
          await cl.query(`DELETE FROM "StockLedger" WHERE "tenantId"=$1`, [t]);
          await cl.query(`DELETE FROM "ProductStock" WHERE "tenantId"=$1`, [t]);
          await cl.query(`DELETE FROM "ProductVariantOption" WHERE "variantGroupId"=$1`, [group]);
          await cl.query(`DELETE FROM "ProductVariantGroup" WHERE id=$1`, [group]);
          await cl.query(`DELETE FROM "Member" WHERE id=$1`, [member]);
          await cl.query(`DELETE FROM "CashierShift" WHERE id=$1`, [shift]);
          await cl.query(`DELETE FROM "Product" WHERE id=$1`, [product]);
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
