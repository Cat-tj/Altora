import { randomUUID } from "node:crypto";
import { normalizeRetailCart, validateRetailPayment } from "@altora/pos-core";
import { db } from "./db";
import type { MarketRole } from "./market-user";

type AccessibleUser = { tenantId: string; userId: string; role: MarketRole };
type PaymentMethod = "CASH" | "QRIS" | "TRANSFER" | "EWALLET";

export type MarketOutlet = { id: string; name: string; suggestedOpeningCash: number | null };
export type OpenMarketShift = { id: string; outletId: string; outletName: string; openingCash: number; openedAt: Date };
export type MarketPosProduct = { id: string; name: string; sku: string | null; price: number; stock: number; trackStock: boolean };

function outletScope(role: MarketRole) {
  return role === "OWNER"
    ? `o."tenantId" = $1`
    : `o."tenantId" = $1 AND EXISTS (SELECT 1 FROM "UserOutlet" uo WHERE uo."outletId" = o.id AND uo."userId" = $2 AND uo."tenantId" = $1)`;
}

export async function listAccessibleMarketOutlets({ tenantId, userId, role }: AccessibleUser): Promise<MarketOutlet[]> {
  const result = await db.query<{ id: string; name: string; suggested_opening_cash: string | null }>(
    `SELECT o.id, o.name,
            (SELECT cs."closingCash"::text FROM "CashierShift" cs
              WHERE cs."tenantId" = o."tenantId" AND cs."outletId" = o.id
                AND cs.status = 'CLOSED' AND cs."closingCash" IS NOT NULL
              ORDER BY cs."closedAt" DESC LIMIT 1) AS suggested_opening_cash
       FROM "Outlet" o
      WHERE ${outletScope(role)} AND o."isActive" = true
      ORDER BY o.name`,
    [tenantId, userId],
  );
  return result.rows.map((row) => ({ id: row.id, name: row.name, suggestedOpeningCash: row.suggested_opening_cash === null ? null : Number(row.suggested_opening_cash) }));
}

export async function getOpenMarketShift({ tenantId, userId }: Pick<AccessibleUser, "tenantId" | "userId">): Promise<OpenMarketShift | null> {
  const result = await db.query<{ id: string; outlet_id: string; outlet_name: string; opening_cash: string; opened_at: Date }>(
    `SELECT cs.id, cs."outletId" AS outlet_id, o.name AS outlet_name, cs."openingCash"::text AS opening_cash, cs."openedAt" AS opened_at
       FROM "CashierShift" cs
       INNER JOIN "Outlet" o ON o.id = cs."outletId" AND o."tenantId" = cs."tenantId"
      WHERE cs."tenantId" = $1 AND cs."userId" = $2 AND cs.status = 'OPEN'
      ORDER BY cs."openedAt" DESC LIMIT 1`,
    [tenantId, userId],
  );
  const row = result.rows[0];
  return row ? { id: row.id, outletId: row.outlet_id, outletName: row.outlet_name, openingCash: Number(row.opening_cash), openedAt: row.opened_at } : null;
}

export async function openMarketShift(input: AccessibleUser & { outletId: string; openingCash: number }) {
  if (!Number.isSafeInteger(input.openingCash) || input.openingCash < 0) throw new Error("Modal awal tidak valid.");
  const client = await db.connect();
  try {
    await client.query("BEGIN");
    await client.query("SELECT pg_advisory_xact_lock(hashtext($1))", [`market-shift:${input.tenantId}:${input.userId}`]);
    const outlet = await client.query<{ id: string }>(
      `SELECT o.id FROM "Outlet" o WHERE o.id = $3 AND ${outletScope(input.role)} AND o."isActive" = true`,
      [input.tenantId, input.userId, input.outletId],
    );
    if (!outlet.rows[0]) throw new Error("Outlet tidak tersedia untuk akun ini.");
    const existing = await client.query(`SELECT id FROM "CashierShift" WHERE "tenantId" = $1 AND "userId" = $2 AND status = 'OPEN' LIMIT 1`, [input.tenantId, input.userId]);
    if (existing.rows[0]) throw new Error("Kamu masih punya shift yang terbuka.");
    const created = await client.query<{ id: string }>(
      `INSERT INTO "CashierShift" (id, "tenantId", "outletId", "userId", "openingCash", status, "openedAt") VALUES ($1, $2, $3, $4, $5, 'OPEN', NOW()) RETURNING id`,
      [randomUUID(), input.tenantId, input.outletId, input.userId, input.openingCash],
    );
    await client.query("COMMIT");
    return created.rows[0];
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function listMarketPosProducts({ tenantId, outletId }: { tenantId: string; outletId: string }): Promise<MarketPosProduct[]> {
  const result = await db.query<{ id: string; name: string; sku: string | null; price: string; stock: string; track_stock: boolean }>(
    `SELECT p.id, p.name, p.sku, p.price::text, COALESCE(ps.qty, 0)::text AS stock, p."trackStock" AS track_stock
       FROM "Product" p
       LEFT JOIN "ProductStock" ps ON ps."productId" = p.id AND ps."outletId" = $2 AND ps."tenantId" = p."tenantId"
      WHERE p."tenantId" = $1 AND p."isActive" = true AND p.kind = 'GOODS'
      ORDER BY p.name`,
    [tenantId, outletId],
  );
  return result.rows.map((row) => ({ id: row.id, name: row.name, sku: row.sku, price: Number(row.price), stock: Number(row.stock), trackStock: row.track_stock }));
}

export async function createMarketSale(input: Pick<AccessibleUser, "tenantId" | "userId"> & { shiftId: string; items: { productId: string; quantity: number }[]; paymentMethod: PaymentMethod; amountPaid: number }) {
  const items = normalizeRetailCart(input.items);
  const client = await db.connect();
  try {
    await client.query("BEGIN");
    const shiftResult = await client.query<{ id: string; outlet_id: string }>(
      `SELECT id, "outletId" AS outlet_id FROM "CashierShift" WHERE id = $1 AND "tenantId" = $2 AND "userId" = $3 AND status = 'OPEN' FOR UPDATE`,
      [input.shiftId, input.tenantId, input.userId],
    );
    const shift = shiftResult.rows[0];
    if (!shift) throw new Error("Shift aktif tidak ditemukan. Muat ulang halaman.");
    const productIds = items.map((item) => item.productId);
    const products = await client.query<{ id: string; name: string; price: string; track_stock: boolean }>(
      `SELECT p.id, p.name, p.price::text, p."trackStock" AS track_stock
         FROM "Product" p
        WHERE p."tenantId" = $1 AND p.id = ANY($2::text[]) AND p."isActive" = true AND p.kind = 'GOODS'
        FOR UPDATE`,
      [input.tenantId, productIds],
    );
    if (products.rows.length !== items.length) throw new Error("Salah satu produk sudah tidak tersedia. Muat ulang katalog.");
    const trackedProductIds = products.rows.filter((product) => product.track_stock).map((product) => product.id);
    const stockResult = trackedProductIds.length
      ? await client.query<{ product_id: string; qty: string }>(
          `SELECT "productId" AS product_id, qty::text FROM "ProductStock"
            WHERE "tenantId" = $1 AND "outletId" = $2 AND "productId" = ANY($3::text[]) FOR UPDATE`,
          [input.tenantId, shift.outlet_id, trackedProductIds],
        )
      : { rows: [] as { product_id: string; qty: string }[] };
    const stockByProduct = new Map(stockResult.rows.map((stock) => [stock.product_id, Number(stock.qty)]));
    const productById = new Map(products.rows.map((product) => [product.id, product]));
    const saleItems = items.map((item) => {
      const product = productById.get(item.productId);
      if (!product) throw new Error("Produk tidak ditemukan.");
      if (product.track_stock && (stockByProduct.get(item.productId) ?? 0) < item.quantity) throw new Error(`Stok ${product.name} tidak cukup.`);
      const price = Number(product.price);
      return { ...item, name: product.name, price, subtotal: price * item.quantity, trackStock: product.track_stock };
    });
    const subtotal = saleItems.reduce((total, item) => total + item.subtotal, 0);
    const payment = validateRetailPayment({ method: input.paymentMethod, total: subtotal, amountPaid: input.amountPaid });
    const day = new Date().toISOString().slice(0, 10).replaceAll("-", "");
    await client.query("SELECT pg_advisory_xact_lock(hashtext($1))", [`market-invoice:${input.tenantId}:${shift.outlet_id}:${day}`]);
    const sequence = await client.query<{ count: string }>(`SELECT COUNT(*)::text AS count FROM "Sale" WHERE "tenantId" = $1 AND "outletId" = $2 AND "invoiceNumber" LIKE $3`, [input.tenantId, shift.outlet_id, `MKT-${day}-%`]);
    const invoiceNumber = `MKT-${day}-${String(Number(sequence.rows[0]?.count ?? 0) + 1).padStart(4, "0")}`;
    const saleId = randomUUID();
    await client.query(
      `INSERT INTO "Sale" (id, "tenantId", "outletId", "shiftId", "cashierId", "invoiceNumber", subtotal, "discountAmount", "taxAmount", total, "paymentMethod", "amountPaid", "changeAmount", status, "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, 0, 0, $7, $8::"PaymentMethod", $9, $10, 'COMPLETED', NOW(), NOW())`,
      [saleId, input.tenantId, shift.outlet_id, input.shiftId, input.userId, invoiceNumber, subtotal, input.paymentMethod, payment.amountPaid, payment.change],
    );
    for (const item of saleItems) {
      await client.query(
        `INSERT INTO "SaleItem" (id, "tenantId", "saleId", "productId", "productName", price, qty, "discountAmount", subtotal) VALUES ($1, $2, $3, $4, $5, $6, $7, 0, $8)`,
        [randomUUID(), input.tenantId, saleId, item.productId, item.name, item.price, item.quantity, item.subtotal],
      );
      if (item.trackStock) {
        const update = await client.query(`UPDATE "ProductStock" SET qty = qty - $1, "updatedAt" = NOW() WHERE "tenantId" = $2 AND "productId" = $3 AND "outletId" = $4 AND qty >= $1`, [item.quantity, input.tenantId, item.productId, shift.outlet_id]);
        if (update.rowCount !== 1) throw new Error(`Stok ${item.name} berubah. Muat ulang katalog lalu ulangi transaksi.`);
      }
    }
    await client.query("COMMIT");
    return { id: saleId, invoiceNumber, total: subtotal, change: payment.change };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
