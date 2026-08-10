import { db } from "@altora/db/pool";

export interface ServiceContext {
  tenantId: string;
  userId: string;
  outletId: string;
}

export interface ServiceCatalogItem {
  id: string;
  name: string;
  category: string;
  price: number;
  durationMinutes: number;
  itemType: "SERVICE" | "PRODUCT";
}

export interface ServiceStaff {
  id: string;
  name: string;
}

export async function listServiceCatalog(
  ctx: ServiceContext | string,
): Promise<ServiceCatalogItem[]> {
  const tenantId = typeof ctx === "string" ? ctx : ctx.tenantId;
  const result = await db.query<ServiceCatalogItem>(
    `SELECT id, name, category, price, "durationMinutes", "itemType"
       FROM "ServiceCatalogItem"
      WHERE "tenantId" = $1 AND "isActive" = true
      ORDER BY category, name`,
    [tenantId],
  );
  return result.rows;
}

export async function listServiceStaff(
  ctx: ServiceContext | string,
): Promise<ServiceStaff[]> {
  const tenantId = typeof ctx === "string" ? ctx : ctx.tenantId;
  const result = await db.query<ServiceStaff>(
    `SELECT id, name FROM "ServiceStaff"
      WHERE "tenantId" = $1 AND "isActive" = true ORDER BY name`,
    [tenantId],
  );
  return result.rows;
}

export async function createServiceSale(input: {
  ctx: ServiceContext;
  staffId?: string;
  paymentMethod: string;
  requestId: string;
  items: Array<{ catalogItemId: string; quantity: number }>;
}) {
  if (!input.items.length) throw new Error("Keranjang transaksi kosong.");

  const client = await db.connect();
  try {
    await client.query("BEGIN");

    const existing = await client.query<{ id: string }>(
      `SELECT "saleId" AS id FROM "ServiceCheckoutRequest"
        WHERE "tenantId" = $1 AND "requestId" = $2 FOR UPDATE`,
      [input.ctx.tenantId, input.requestId],
    );

    const existingRow = existing.rows[0];
    if (existingRow) {
      await client.query("COMMIT");
      return { id: existingRow.id, duplicate: true };
    }

    if (input.staffId) {
      const staffCheck = await client.query(
        `SELECT id FROM "ServiceStaff" WHERE "tenantId" = $1 AND id = $2 AND "isActive" = true`,
        [input.ctx.tenantId, input.staffId],
      );
      if (!staffCheck.rows.length) {
        throw new Error(
          "Terapis / staff tidak ditemukan pada tenant ini.",
        );
      }
    }

    let total = 0;
    const saleItems = [];
    for (const item of input.items) {
      const catalogRes = await client.query<ServiceCatalogItem>(
        `SELECT id, name, price FROM "ServiceCatalogItem"
          WHERE "tenantId" = $1 AND id = $2 AND "isActive" = true`,
        [input.ctx.tenantId, item.catalogItemId],
      );
      const catalog = catalogRes.rows[0];
      if (!catalog) {
        throw new Error(`Item catalog '${item.catalogItemId}' tidak valid.`);
      }
      const subtotal = Number(catalog.price) * item.quantity;
      total += subtotal;
      saleItems.push({ ...catalog, quantity: item.quantity, subtotal });
    }

    const saleId = `sale_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    await client.query(
      `INSERT INTO "ServiceSale" (id, "tenantId", "outletId", "staffId", total, "paymentMethod")
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        saleId,
        input.ctx.tenantId,
        input.ctx.outletId,
        input.staffId ?? null,
        total,
        input.paymentMethod,
      ],
    );

    for (const item of saleItems) {
      const itemId = `ssi_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      await client.query(
        `INSERT INTO "ServiceSaleItem" (id, "tenantId", "saleId", "catalogItemId", name, price, quantity, subtotal)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          itemId,
          input.ctx.tenantId,
          saleId,
          item.id,
          item.name,
          item.price,
          item.quantity,
          item.subtotal,
        ],
      );
    }

    const reqRowId = `scr_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    await client.query(
      `INSERT INTO "ServiceCheckoutRequest" (id, "tenantId", "requestId", "saleId")
       VALUES ($1, $2, $3, $4)`,
      [reqRowId, input.ctx.tenantId, input.requestId, saleId],
    );

    await client.query("COMMIT");
    return { id: saleId, total, duplicate: false };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
