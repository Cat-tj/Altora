import { randomUUID } from "node:crypto";
import { db } from "./db";
import { applyStockMovement } from "./market-stock-ledger";
import type { MarketRole } from "./market-user";

/**
 * Retur penjualan.
 *
 * Berbeda dari pembatalan: pembatalan menggugurkan seluruh transaksi, retur
 * mengembalikan sebagian barang beserta uangnya. Karena itu retur punya nomor
 * sendiri dan sumber ledger sendiri — laporan harus bisa memisahkan barang
 * yang tidak jadi terjual dari barang yang kembali setelah dibeli.
 *
 * Barang yang kembali rusak dicatat tapi tidak menambah stok.
 */

const id = (prefix: string) => `${prefix}_${randomUUID().replaceAll("-", "").slice(0, 20)}`;

const OUTLET_SCOPE = `o."tenantId" = $1 AND (
  $3::text = 'OWNER'
  OR EXISTS (SELECT 1 FROM "UserOutlet" uo
              WHERE uo."outletId" = o.id AND uo."userId" = $2 AND uo."tenantId" = $1)
)`;

export type ReturnableItem = {
  saleItemId: string;
  productId: string;
  productName: string;
  qtySold: number;
  qtyReturned: number;
  qtyReturnable: number;
  price: number;
};

export type ReturnableSale = {
  id: string;
  invoiceNumber: string;
  outletId: string;
  outletName: string;
  total: number;
  createdAt: string;
  items: ReturnableItem[];
};

/** Cari penjualan yang masih bisa diretur berdasarkan nomor invoice. */
export async function findSaleForReturn(
  user: { tenantId: string; userId: string; role: MarketRole },
  invoiceNumber: string,
): Promise<ReturnableSale | null> {
  const { rows } = await db.query(
    `SELECT s.id, s."invoiceNumber", s."outletId", o.name AS "outletName", s.total, s."createdAt"
       FROM "Sale" s
       INNER JOIN "Outlet" o ON o.id = s."outletId"
      WHERE s."tenantId" = $1 AND ${OUTLET_SCOPE}
        AND UPPER(s."invoiceNumber") = UPPER($4)
        AND s.status = 'COMPLETED'
      LIMIT 1`,
    [user.tenantId, user.userId, user.role, invoiceNumber.trim()],
  );
  const sale = rows[0];
  if (!sale) return null;

  const items = await db.query(
    `SELECT si.id AS "saleItemId", si."productId", si."productName",
            si.qty AS "qtySold", si.price,
            COALESCE(SUM(ri.qty), 0)::int AS "qtyReturned"
       FROM "SaleItem" si
       LEFT JOIN "SaleReturnItem" ri ON ri."saleItemId" = si.id
      WHERE si."saleId" = $1
      GROUP BY si.id, si."productId", si."productName", si.qty, si.price
      ORDER BY si."productName"`,
    [sale.id],
  );

  return {
    ...sale,
    items: items.rows.map((item) => ({
      ...item,
      qtyReturnable: item.qtySold - item.qtyReturned,
    })) as ReturnableItem[],
  };
}

export async function listReturns(user: { tenantId: string; userId: string; role: MarketRole }) {
  const { rows } = await db.query(
    `SELECT r.id, r."returnNumber", r.reason, r."refundAmount", r."restockCount",
            r."createdAt", s."invoiceNumber", o.name AS "outletName", u.name AS "createdByName",
            COALESCE(SUM(ri.qty), 0)::int AS "totalQty"
       FROM "SaleReturn" r
       INNER JOIN "Sale" s ON s.id = r."saleId"
       INNER JOIN "Outlet" o ON o.id = r."outletId"
       INNER JOIN "User" u ON u.id = r."createdById"
       LEFT JOIN "SaleReturnItem" ri ON ri."returnId" = r.id
      WHERE r."tenantId" = $1 AND ${OUTLET_SCOPE}
      GROUP BY r.id, s."invoiceNumber", o.name, u.name
      ORDER BY r."createdAt" DESC
      LIMIT 100`,
    [user.tenantId, user.userId, user.role],
  );
  return rows as {
    id: string; returnNumber: string; reason: string; refundAmount: number;
    restockCount: number; createdAt: string; invoiceNumber: string;
    outletName: string; createdByName: string; totalQty: number;
  }[];
}

async function nextReturnNumber(client: { query: typeof db.query }, tenantId: string) {
  const now = new Date();
  const stamp = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("");
  const prefix = `RT-${stamp}-`;
  const { rows } = await client.query(
    `SELECT COUNT(*)::int AS count FROM "SaleReturn" WHERE "tenantId" = $1 AND "returnNumber" LIKE $2`,
    [tenantId, `${prefix}%`],
  );
  return `${prefix}${String(rows[0].count + 1).padStart(3, "0")}`;
}

export async function createReturn(input: {
  tenantId: string;
  userId: string;
  role: MarketRole;
  saleId: string;
  reason: string;
  lines: { saleItemId: string; qty: number; restock: boolean }[];
}) {
  const reason = input.reason.trim();
  if (reason.length < 4) throw new Error("Tulis alasan retur, minimal 4 karakter.");

  const lines = input.lines.filter((line) => line.qty > 0);
  if (lines.length === 0) throw new Error("Pilih minimal satu barang yang diretur.");

  const client = await db.connect();
  try {
    await client.query("BEGIN");

    const sale = (
      await client.query<{ id: string; outletId: string; invoiceNumber: string }>(
        `SELECT s.id, s."outletId", s."invoiceNumber"
           FROM "Sale" s INNER JOIN "Outlet" o ON o.id = s."outletId"
          WHERE s.id = $4 AND s."tenantId" = $1 AND ${OUTLET_SCOPE} AND s.status = 'COMPLETED'
          FOR UPDATE OF s`,
        [input.tenantId, input.userId, input.role, input.saleId],
      )
    ).rows[0];
    if (!sale) throw new Error("Transaksi tidak ditemukan, sudah dibatalkan, atau di luar akses Anda.");

    /* Kunci barisnya lebih dulu, baru hitung sisanya. Postgres menolak
       FOR UPDATE bersama GROUP BY, jadi keduanya tidak bisa satu query —
       tapi kuncinya tetap dipegang sampai commit, sehingga dua retur
       bersamaan pada nota yang sama tidak bisa melebihi qty terjual. */
    const sold = await client.query<{
      saleItemId: string; productId: string; productName: string; price: number; qty: number;
    }>(
      `SELECT id AS "saleItemId", "productId", "productName", price, qty
         FROM "SaleItem" WHERE "saleId" = $1 FOR UPDATE`,
      [sale.id],
    );

    const returned = await client.query<{ saleItemId: string; qty: number }>(
      `SELECT "saleItemId", COALESCE(SUM(qty), 0)::int AS qty
         FROM "SaleReturnItem"
        WHERE "saleItemId" = ANY($1::text[])
        GROUP BY "saleItemId"`,
      [sold.rows.map((row) => row.saleItemId)],
    );
    const returnedByItem = new Map(returned.rows.map((row) => [row.saleItemId, row.qty]));

    const byItem = new Map(
      sold.rows.map((row) => [
        row.saleItemId,
        { ...row, remaining: row.qty - (returnedByItem.get(row.saleItemId) ?? 0) },
      ]),
    );

    const returnId = id("rt");
    const returnNumber = await nextReturnNumber(client, input.tenantId);

    let refundAmount = 0;
    let restockCount = 0;
    const prepared: { line: (typeof lines)[number]; item: NonNullable<ReturnType<typeof byItem.get>> }[] = [];

    for (const line of lines) {
      const item = byItem.get(line.saleItemId);
      if (!item) throw new Error("Ada barang yang tidak termasuk dalam transaksi ini.");
      if (line.qty > item.remaining) {
        throw new Error(`${item.productName} hanya bisa diretur ${item.remaining} lagi.`);
      }
      refundAmount += item.price * line.qty;
      if (line.restock) restockCount += line.qty;
      prepared.push({ line, item });
    }

    await client.query(
      `INSERT INTO "SaleReturn"
         (id, "tenantId", "saleId", "outletId", "returnNumber", reason, "refundAmount", "restockCount", "createdById")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [returnId, input.tenantId, sale.id, sale.outletId, returnNumber, reason, refundAmount, restockCount, input.userId],
    );

    for (const { line, item } of prepared) {
      await client.query(
        `INSERT INTO "SaleReturnItem"
           (id, "tenantId", "returnId", "saleItemId", "productId", "productName", qty, restock, subtotal)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [id("rti"), input.tenantId, returnId, line.saleItemId, item.productId, item.productName,
         line.qty, line.restock, item.price * line.qty],
      );

      /* Hanya barang layak jual yang kembali ke stok. */
      if (line.restock) {
        await applyStockMovement(client, {
          tenantId: input.tenantId,
          outletId: sale.outletId,
          productId: item.productId,
          delta: line.qty,
          source: "RETURN",
          sourceId: returnId,
          actorId: input.userId,
          note: `Retur ${returnNumber} dari ${sale.invoiceNumber}`,
          idempotencyKey: `return:${returnId}:${item.productId}`,
        });
      }
    }

    await client.query(
      `INSERT INTO "AuditLog" (id, "tenantId", "userId", action, description)
       VALUES ($1, $2, $3, 'SALE_RETURN', $4)`,
      [id("aud"), input.tenantId, input.userId,
       `Retur ${returnNumber} atas ${sale.invoiceNumber}: ${reason}`],
    );

    await client.query("COMMIT");
    return { returnNumber, refundAmount, restockCount };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
