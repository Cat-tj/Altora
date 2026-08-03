import { randomUUID } from "node:crypto";
import { db } from "./db";
import { applyStockMovement } from "./market-stock-ledger";
import type { MarketRole } from "./market-user";

/**
 * Stock opname.
 *
 * Alurnya dua langkah seperti penerimaan: hitungan disimpan sebagai draft
 * lebih dulu, selisihnya baru masuk stok saat diterapkan. Menghitung fisik
 * satu rak butuh waktu, dan draft membuat pekerjaan itu bisa disimpan tanpa
 * mengubah saldo yang sedang dipakai kasir.
 *
 * Saldo sistem dibekukan saat opname dibuat. Kalau dibaca ulang saat
 * diterapkan, penjualan yang terjadi di sela-selanya akan ikut terhapus oleh
 * koreksi — hitungan fisik tadi memang tidak memperhitungkannya.
 */

const id = (prefix: string) => `${prefix}_${randomUUID().replaceAll("-", "").slice(0, 20)}`;

const OUTLET_SCOPE = `o."tenantId" = $1 AND (
  $3::text = 'OWNER'
  OR EXISTS (SELECT 1 FROM "UserOutlet" uo
              WHERE uo."outletId" = o.id AND uo."userId" = $2 AND uo."tenantId" = $1)
)`;

export type CountSummary = {
  id: string;
  countNumber: string;
  status: "DRAFT" | "APPLIED" | "CANCELLED";
  outletName: string;
  itemCount: number;
  surplus: number;
  shortage: number;
  createdByName: string;
  createdAt: string;
  appliedAt: string | null;
};

export async function listStockCounts(user: { tenantId: string; userId: string; role: MarketRole }) {
  const { rows } = await db.query(
    `SELECT c.id, c."countNumber", c.status, o.name AS "outletName",
            COUNT(i.id)::int AS "itemCount",
            COALESCE(SUM(GREATEST(i."countedQty" - i."systemQty", 0)), 0)::int AS surplus,
            COALESCE(SUM(GREATEST(i."systemQty" - i."countedQty", 0)), 0)::int AS shortage,
            u.name AS "createdByName", c."createdAt", c."appliedAt"
       FROM "StockCount" c
       INNER JOIN "Outlet" o ON o.id = c."outletId"
       INNER JOIN "User" u ON u.id = c."createdById"
       LEFT JOIN "StockCountItem" i ON i."countId" = c.id
      WHERE c."tenantId" = $1 AND ${OUTLET_SCOPE}
      GROUP BY c.id, o.name, u.name
      ORDER BY c."createdAt" DESC
      LIMIT 100`,
    [user.tenantId, user.userId, user.role],
  );
  return rows as CountSummary[];
}

export async function getCountItems(tenantId: string, countId: string) {
  const { rows } = await db.query(
    `SELECT id, "productName", "systemQty", "countedQty",
            ("countedQty" - "systemQty")::int AS delta, notes
       FROM "StockCountItem"
      WHERE "countId" = $1 AND "tenantId" = $2
      ORDER BY "productName"`,
    [countId, tenantId],
  );
  return rows as {
    id: string; productName: string; systemQty: number; countedQty: number; delta: number; notes: string | null;
  }[];
}

/** Produk beserta saldo sistemnya, sebagai dasar lembar hitung. */
export async function getCountSheet(tenantId: string, outletId: string) {
  const { rows } = await db.query(
    `SELECT p.id, p.name, p.sku, COALESCE(ps.qty, 0)::int AS "systemQty"
       FROM "Product" p
       LEFT JOIN "ProductStock" ps ON ps."productId" = p.id AND ps."outletId" = $2
      WHERE p."tenantId" = $1 AND p."isActive" = true AND p."trackStock" = true
      ORDER BY p.name`,
    [tenantId, outletId],
  );
  return rows as { id: string; name: string; sku: string | null; systemQty: number }[];
}

async function nextCountNumber(client: { query: typeof db.query }, tenantId: string) {
  const now = new Date();
  const stamp = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("");
  const prefix = `SO-${stamp}-`;
  const { rows } = await client.query(
    `SELECT COUNT(*)::int AS count FROM "StockCount" WHERE "tenantId" = $1 AND "countNumber" LIKE $2`,
    [tenantId, `${prefix}%`],
  );
  return `${prefix}${String(rows[0].count + 1).padStart(3, "0")}`;
}

export async function createStockCount(input: {
  tenantId: string;
  userId: string;
  role: MarketRole;
  outletId: string;
  notes?: string | null;
  lines: { productId: string; countedQty: number }[];
}) {
  if (input.lines.length === 0) throw new Error("Isi hitungan minimal satu produk.");

  const client = await db.connect();
  try {
    await client.query("BEGIN");

    const outlet = await client.query(
      `SELECT o.id FROM "Outlet" o WHERE o.id = $4 AND ${OUTLET_SCOPE} AND o."isActive" = true`,
      [input.tenantId, input.userId, input.role, input.outletId],
    );
    if (outlet.rowCount === 0) throw new Error("Outlet tidak berada dalam akses Anda.");

    const stock = await client.query<{ id: string; name: string; systemQty: number }>(
      `SELECT p.id, p.name, COALESCE(ps.qty, 0)::int AS "systemQty"
         FROM "Product" p
         LEFT JOIN "ProductStock" ps ON ps."productId" = p.id AND ps."outletId" = $2
        WHERE p."tenantId" = $1 AND p.id = ANY($3::text[]) AND p."isActive" = true`,
      [input.tenantId, input.outletId, input.lines.map((line) => line.productId)],
    );
    const byProduct = new Map(stock.rows.map((row) => [row.id, row]));

    const countId = id("so");
    const countNumber = await nextCountNumber(client, input.tenantId);

    await client.query(
      `INSERT INTO "StockCount" (id, "tenantId", "outletId", "countNumber", status, notes, "createdById")
       VALUES ($1, $2, $3, $4, 'DRAFT', $5, $6)`,
      [countId, input.tenantId, input.outletId, countNumber, input.notes ?? null, input.userId],
    );

    let differences = 0;
    for (const line of input.lines) {
      const product = byProduct.get(line.productId);
      if (!product) throw new Error("Ada produk yang tidak ditemukan atau sudah nonaktif.");

      const counted = Math.max(0, Math.trunc(line.countedQty));
      if (counted !== product.systemQty) differences += 1;

      await client.query(
        `INSERT INTO "StockCountItem"
           (id, "tenantId", "countId", "productId", "productName", "systemQty", "countedQty")
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [id("soi"), input.tenantId, countId, product.id, product.name, product.systemQty, counted],
      );
    }

    await client.query("COMMIT");
    return { id: countId, countNumber, differences };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

/** Terapkan selisih opname ke stok. Hanya baris yang berbeda yang bergerak. */
export async function applyStockCount(input: {
  tenantId: string;
  userId: string;
  role: MarketRole;
  countId: string;
}) {
  const client = await db.connect();
  try {
    await client.query("BEGIN");

    const count = (
      await client.query<{ id: string; outletId: string; status: string; countNumber: string }>(
        `SELECT c.id, c."outletId", c.status, c."countNumber"
           FROM "StockCount" c INNER JOIN "Outlet" o ON o.id = c."outletId"
          WHERE c.id = $4 AND c."tenantId" = $1 AND ${OUTLET_SCOPE}
          FOR UPDATE OF c`,
        [input.tenantId, input.userId, input.role, input.countId],
      )
    ).rows[0];

    if (!count) throw new Error("Opname tidak ditemukan atau di luar akses Anda.");
    if (count.status === "APPLIED") throw new Error("Opname ini sudah diterapkan.");
    if (count.status === "CANCELLED") throw new Error("Opname ini sudah dibatalkan.");

    const items = await client.query<{ productId: string; productName: string; delta: number }>(
      `SELECT "productId", "productName", ("countedQty" - "systemQty")::int AS delta
         FROM "StockCountItem"
        WHERE "countId" = $1 AND "countedQty" <> "systemQty"`,
      [count.id],
    );

    for (const item of items.rows) {
      await applyStockMovement(client, {
        tenantId: input.tenantId,
        outletId: count.outletId,
        productId: item.productId,
        delta: item.delta,
        source: "ADJUSTMENT",
        sourceId: count.id,
        actorId: input.userId,
        note: `Opname ${count.countNumber}`,
        idempotencyKey: `count:${count.id}:${item.productId}`,
      });
    }

    await client.query(
      `UPDATE "StockCount" SET status = 'APPLIED', "appliedAt" = NOW(), "appliedById" = $2
        WHERE id = $1`,
      [count.id, input.userId],
    );

    await client.query("COMMIT");
    return { countNumber: count.countNumber, adjusted: items.rowCount ?? 0 };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function cancelStockCount(input: { tenantId: string; countId: string }) {
  const { rowCount } = await db.query(
    `UPDATE "StockCount" SET status = 'CANCELLED'
      WHERE id = $1 AND "tenantId" = $2 AND status = 'DRAFT'`,
    [input.countId, input.tenantId],
  );
  if (rowCount === 0) throw new Error("Hanya opname berstatus draft yang bisa dibatalkan.");
}
