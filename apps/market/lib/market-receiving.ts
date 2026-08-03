import { randomUUID } from "node:crypto";
import { db } from "./db";
import { applyStockMovement } from "./market-stock-ledger";
import type { MarketRole } from "./market-user";

/**
 * Penerimaan barang.
 *
 * Alurnya dua langkah dan itu disengaja. Nota dibuat sebagai DRAFT lebih dulu,
 * baru diselesaikan; stok bertambah hanya saat diselesaikan. Barang datang
 * sering perlu dicek dan dikoreksi dulu, dan draft memberi ruang itu tanpa
 * mengotori saldo.
 */

const id = (prefix: string) => `${prefix}_${randomUUID().replaceAll("-", "").slice(0, 20)}`;

export type ReceiptLineInput = {
  productId: string;
  qtyAccepted: number;
  qtyDefect?: number;
  unitCost?: number;
  batchNumber?: string | null;
  notes?: string | null;
};

export type ReceiptSummary = {
  id: string;
  receiptNumber: string;
  status: "DRAFT" | "COMPLETED" | "CANCELLED";
  outletName: string;
  supplierName: string | null;
  itemCount: number;
  totalAccepted: number;
  totalDefect: number;
  totalCost: number;
  receivedAt: string;
  completedAt: string | null;
};

/**
 * Outlet yang boleh disentuh peran ini: OWNER melihat semua outlet tenant,
 * peran lain hanya outlet yang dipetakan padanya.
 *
 * Selalu memakai ketiga parameter apa pun perannya, supaya jumlah placeholder
 * tidak berubah-ubah mengikuti cabang — itu sumber galat bind yang mudah lolos
 * dari typecheck.
 */
const OUTLET_SCOPE = `o."tenantId" = $1 AND (
  $3::text = 'OWNER'
  OR EXISTS (SELECT 1 FROM "UserOutlet" uo
              WHERE uo."outletId" = o.id AND uo."userId" = $2 AND uo."tenantId" = $1)
)`;

export async function listSuppliers(tenantId: string) {
  const { rows } = await db.query(
    `SELECT id, name, phone, "contactPerson", "paymentTerms", status
       FROM "Supplier" WHERE "tenantId" = $1 AND status = 'ACTIVE' ORDER BY name`,
    [tenantId],
  );
  return rows as { id: string; name: string; phone: string | null; contactPerson: string | null; paymentTerms: string | null; status: string }[];
}

export async function listReceipts(user: { tenantId: string; userId: string; role: MarketRole }) {
  const { rows } = await db.query(
    `WITH outlets AS (SELECT o.id, o.name FROM "Outlet" o WHERE ${OUTLET_SCOPE} AND o."isActive" = true)
     SELECT r.id, r."receiptNumber", r.status, o.name AS "outletName", s.name AS "supplierName",
            COUNT(i.id)::int AS "itemCount",
            COALESCE(SUM(i."qtyAccepted"), 0)::int AS "totalAccepted",
            COALESCE(SUM(i."qtyDefect"), 0)::int AS "totalDefect",
            (COALESCE(SUM(i."qtyAccepted" * i."unitCost"), 0) + r."shippingCost" + r."otherCost")::int AS "totalCost",
            r."receivedAt", r."completedAt"
       FROM "StockReceipt" r
       INNER JOIN outlets o ON o.id = r."outletId"
       LEFT JOIN "Supplier" s ON s.id = r."supplierId"
       LEFT JOIN "StockReceiptItem" i ON i."receiptId" = r.id
      WHERE r."tenantId" = $1
      GROUP BY r.id, o.name, s.name
      ORDER BY r."receivedAt" DESC
      LIMIT 100`,
    [user.tenantId, user.userId, user.role],
  );
  return rows as ReceiptSummary[];
}

export async function getReceipt(user: { tenantId: string; userId: string; role: MarketRole }, receiptId: string) {
  const { rows } = await db.query(
    `WITH outlets AS (SELECT o.id, o.name FROM "Outlet" o WHERE ${OUTLET_SCOPE})
     SELECT r.id, r."receiptNumber", r.status, r.notes, r."shippingCost", r."otherCost",
            r."receivedAt", r."completedAt", o.name AS "outletName", s.name AS "supplierName",
            u.name AS "receivedByName"
       FROM "StockReceipt" r
       INNER JOIN outlets o ON o.id = r."outletId"
       LEFT JOIN "Supplier" s ON s.id = r."supplierId"
       LEFT JOIN "User" u ON u.id = r."receivedById"
      WHERE r.id = $4 AND r."tenantId" = $1`,
    [user.tenantId, user.userId, user.role, receiptId],
  );
  const receipt = rows[0];
  if (!receipt) return null;

  const items = await db.query(
    `SELECT i.id, i."productName", i."qtyAccepted", i."qtyDefect", i."unitCost", i."batchNumber", i.notes
       FROM "StockReceiptItem" i WHERE i."receiptId" = $1 ORDER BY i."productName"`,
    [receiptId],
  );
  return { ...receipt, items: items.rows };
}

/**
 * Nomor nota berurut per hari, mis. GR-20260802-003.
 *
 * Dihitung dari nota hari itu di dalam transaksi pemanggil, jadi dua
 * penerimaan bersamaan tidak bisa mendapat nomor yang sama.
 */
async function nextReceiptNumber(client: { query: typeof db.query }, tenantId: string) {
  const today = new Date();
  const stamp = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, "0"),
    String(today.getDate()).padStart(2, "0"),
  ].join("");
  const prefix = `GR-${stamp}-`;
  const { rows } = await client.query(
    `SELECT COUNT(*)::int AS count FROM "StockReceipt"
      WHERE "tenantId" = $1 AND "receiptNumber" LIKE $2`,
    [tenantId, `${prefix}%`],
  );
  return `${prefix}${String(rows[0].count + 1).padStart(3, "0")}`;
}

export async function createReceipt(input: {
  tenantId: string;
  userId: string;
  role: MarketRole;
  outletId: string;
  supplierId?: string | null;
  shippingCost?: number;
  otherCost?: number;
  notes?: string | null;
  items: ReceiptLineInput[];
}) {
  const lines = input.items.filter((item) => item.qtyAccepted > 0 || (item.qtyDefect ?? 0) > 0);
  if (lines.length === 0) throw new Error("Tambahkan minimal satu barang yang diterima.");

  const client = await db.connect();
  try {
    await client.query("BEGIN");

    const outlet = await client.query(
      `SELECT o.id FROM "Outlet" o WHERE o.id = $4 AND ${OUTLET_SCOPE} AND o."isActive" = true`,
      [input.tenantId, input.userId, input.role, input.outletId],
    );
    if (outlet.rowCount === 0) throw new Error("Outlet tidak berada dalam akses Anda.");

    const products = await client.query<{ id: string; name: string }>(
      `SELECT id, name FROM "Product"
        WHERE "tenantId" = $1 AND id = ANY($2::text[]) AND "isActive" = true`,
      [input.tenantId, lines.map((line) => line.productId)],
    );
    const names = new Map(products.rows.map((row) => [row.id, row.name]));
    for (const line of lines) {
      if (!names.has(line.productId)) throw new Error("Ada produk yang tidak ditemukan atau sudah nonaktif.");
    }

    const receiptId = id("gr");
    const receiptNumber = await nextReceiptNumber(client, input.tenantId);

    await client.query(
      `INSERT INTO "StockReceipt"
         (id, "tenantId", "outletId", "supplierId", "receiptNumber", status,
          "shippingCost", "otherCost", notes, "receivedById")
       VALUES ($1, $2, $3, $4, $5, 'DRAFT', $6, $7, $8, $9)`,
      [
        receiptId, input.tenantId, input.outletId, input.supplierId ?? null, receiptNumber,
        Math.max(0, Math.trunc(input.shippingCost ?? 0)),
        Math.max(0, Math.trunc(input.otherCost ?? 0)),
        input.notes ?? null, input.userId,
      ],
    );

    for (const line of lines) {
      await client.query(
        `INSERT INTO "StockReceiptItem"
           (id, "tenantId", "receiptId", "productId", "productName", "qtyAccepted", "qtyDefect", "unitCost", "batchNumber", notes)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
          id("gri"), input.tenantId, receiptId, line.productId, names.get(line.productId),
          Math.max(0, Math.trunc(line.qtyAccepted)),
          Math.max(0, Math.trunc(line.qtyDefect ?? 0)),
          Math.max(0, Math.trunc(line.unitCost ?? 0)),
          line.batchNumber ?? null, line.notes ?? null,
        ],
      );
    }

    await client.query("COMMIT");
    return { id: receiptId, receiptNumber };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Selesaikan nota: stok bertambah sebanyak qty yang lolos, sekali saja.
 *
 * Kunci idempotensinya dibentuk dari nota dan produknya, jadi tombol yang
 * ditekan dua kali tidak menggandakan stok — ledger yang menolaknya, bukan
 * pengecekan di aplikasi.
 */
export async function completeReceipt(input: {
  tenantId: string;
  userId: string;
  role: MarketRole;
  receiptId: string;
}) {
  const client = await db.connect();
  try {
    await client.query("BEGIN");

    const receipt = (
      await client.query<{ id: string; outletId: string; status: string; receiptNumber: string }>(
        `SELECT r.id, r."outletId", r.status, r."receiptNumber"
           FROM "StockReceipt" r
           INNER JOIN "Outlet" o ON o.id = r."outletId"
          WHERE r.id = $4 AND r."tenantId" = $1 AND ${OUTLET_SCOPE}
          FOR UPDATE OF r`,
        [input.tenantId, input.userId, input.role, input.receiptId],
      )
    ).rows[0];

    if (!receipt) throw new Error("Nota penerimaan tidak ditemukan atau di luar akses Anda.");
    if (receipt.status === "COMPLETED") throw new Error("Nota ini sudah diselesaikan.");
    if (receipt.status === "CANCELLED") throw new Error("Nota ini sudah dibatalkan.");

    const items = await client.query<{ productId: string; productName: string; qtyAccepted: number }>(
      `SELECT "productId", "productName", "qtyAccepted"
         FROM "StockReceiptItem" WHERE "receiptId" = $1 AND "qtyAccepted" > 0`,
      [receipt.id],
    );

    for (const item of items.rows) {
      await applyStockMovement(client, {
        tenantId: input.tenantId,
        outletId: receipt.outletId,
        productId: item.productId,
        delta: item.qtyAccepted,
        source: "RECEIPT",
        sourceId: receipt.id,
        actorId: input.userId,
        note: `Penerimaan ${receipt.receiptNumber}`,
        idempotencyKey: `receipt:${receipt.id}:${item.productId}`,
      });
    }

    await client.query(
      `UPDATE "StockReceipt" SET status = 'COMPLETED', "completedAt" = NOW(), "updatedAt" = NOW()
        WHERE id = $1 AND "tenantId" = $2`,
      [receipt.id, input.tenantId],
    );

    await client.query("COMMIT");
    return { receiptNumber: receipt.receiptNumber, lines: items.rowCount ?? 0 };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function cancelReceipt(input: {
  tenantId: string;
  userId: string;
  role: MarketRole;
  receiptId: string;
}) {
  /* Hanya draft yang boleh dibatalkan. Nota yang sudah selesai berarti stok
     sudah bertambah; membatalkannya butuh koreksi stok tersendiri, bukan
     sekadar mengubah status. */
  const { rowCount } = await db.query(
    `UPDATE "StockReceipt" SET status = 'CANCELLED', "updatedAt" = NOW()
      WHERE id = $1 AND "tenantId" = $2 AND status = 'DRAFT'`,
    [input.receiptId, input.tenantId],
  );
  if (rowCount === 0) throw new Error("Hanya nota berstatus draft yang bisa dibatalkan.");
}
