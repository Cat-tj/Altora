import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import process from "node:process";
import test from "node:test";

const databaseUrl = process.env.DATABASE_URL;
const skip = databaseUrl ? undefined : "DATABASE_URL tidak tersedia";

/**
 * Sifat yang dijaga ledger. Kalau salah satu ini lepas, saldo stok berhenti
 * bisa dipertanggungjawabkan dan selisihnya tidak bisa ditelusuri lagi.
 */
test("ledger stok", { skip }, async (t) => {
  const { Pool } = await import("pg");
  const { applyStockMovement, InsufficientStockError, getStockLedger } = await import("./market-stock-ledger.ts");
  const pool = new Pool({ connectionString: databaseUrl });

  const context = async (run) => {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const row = (
        await client.query(`SELECT ps."tenantId", ps."outletId", ps."productId", ps.qty
                              FROM "ProductStock" ps LIMIT 1`)
      ).rows[0];
      assert.ok(row, "butuh minimal satu baris stok; jalankan db:seed lebih dulu");
      await run(client, row);
    } finally {
      /* Selalu dibatalkan: test tidak boleh meninggalkan jejak di database. */
      await client.query("ROLLBACK");
      client.release();
    }
  };

  await t.test("mencatat delta dan saldo hasilnya", async () => {
    await context(async (client, stock) => {
      const applied = await applyStockMovement(client, {
        tenantId: stock.tenantId,
        outletId: stock.outletId,
        productId: stock.productId,
        delta: 7,
        source: "ADJUSTMENT",
        idempotencyKey: `test:${randomUUID()}`,
      });
      assert.equal(applied, true);

      const [latest] = await getStockLedger(client, {
        tenantId: stock.tenantId,
        outletId: stock.outletId,
        productId: stock.productId,
        limit: 1,
      });
      assert.equal(latest.delta, 7);
      assert.equal(latest.balanceAfter, stock.qty + 7);
    });
  });

  await t.test("kunci idempotensi yang sama tidak menggandakan stok", async () => {
    await context(async (client, stock) => {
      const key = `test:${randomUUID()}`;
      const movement = {
        tenantId: stock.tenantId,
        outletId: stock.outletId,
        productId: stock.productId,
        delta: 5,
        source: "RECEIPT",
        idempotencyKey: key,
      };

      assert.equal(await applyStockMovement(client, movement), true);
      assert.equal(await applyStockMovement(client, movement), false, "penerapan kedua harus ditolak");

      const { rows } = await client.query(
        `SELECT qty FROM "ProductStock"
          WHERE "tenantId" = $1 AND "outletId" = $2 AND "productId" = $3`,
        [stock.tenantId, stock.outletId, stock.productId],
      );
      assert.equal(rows[0].qty, stock.qty + 5, "saldo hanya boleh bertambah sekali");
    });
  });

  await t.test("stok tidak boleh jadi minus", async () => {
    await context(async (client, stock) => {
      await assert.rejects(
        applyStockMovement(client, {
          tenantId: stock.tenantId,
          outletId: stock.outletId,
          productId: stock.productId,
          delta: -(stock.qty + 1),
          source: "SALE",
          idempotencyKey: `test:${randomUUID()}`,
        }),
        InsufficientStockError,
      );
    });
  });

  await t.test("jumlah ledger sama dengan saldo tersimpan", async () => {
    const client = await pool.connect();
    try {
      const { rows } = await client.query(
        `SELECT ps."productId", ps.qty, COALESCE(SUM(l.delta), 0)::int AS ledger
           FROM "ProductStock" ps
           LEFT JOIN "StockLedger" l
             ON l."productId" = ps."productId" AND l."outletId" = ps."outletId" AND l."tenantId" = ps."tenantId"
          WHERE ps."tenantId" NOT LIKE 't_%'
          GROUP BY ps."tenantId", ps."outletId", ps."productId", ps.qty
         HAVING ps.qty <> COALESCE(SUM(l.delta), 0)`,
      );
      assert.deepEqual(rows, [], "setiap saldo harus dijelaskan oleh ledgernya");
    } finally {
      client.release();
    }
  });

  await pool.end();
});
