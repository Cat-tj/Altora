import { db } from "@altora/db/pool";

export type ServiceContext = { tenantId: string; userId: string };
export type ServiceCatalogItem = {
  id: string;
  name: string;
  category: string;
  price: number;
  durationMinutes: number;
  itemType: "SERVICE" | "RETAIL";
};
export type ServiceStaff = { id: string; name: string };

export async function listServiceCatalog(ctx: ServiceContext): Promise<ServiceCatalogItem[]> {
  const result = await db.query<{
    id: string; name: string; category: string; price: number;
    durationMinutes: number; itemType: "SERVICE" | "RETAIL";
  }>(
    `SELECT id, name, category, price, "durationMinutes", "itemType"
       FROM "ServiceCatalogItem"
      WHERE "tenantId" = $1 AND "isActive" = true
      ORDER BY category, name`,
    [ctx.tenantId],
  );
  return result.rows;
}

export async function listServiceStaff(ctx: ServiceContext): Promise<ServiceStaff[]> {
  const result = await db.query<ServiceStaff>(
    `SELECT id, name FROM "ServiceStaff"
      WHERE "tenantId" = $1 AND "isActive" = true ORDER BY name`,
    [ctx.tenantId],
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
    if (existing.rows[0]) { await client.query("COMMIT"); return { id: existing.rows[0].id, idempotent: true }; }
    const ids = input.items.map((item) => item.catalogItemId);
    const catalog = await client.query<{ id: string; name: string; price: number }>(
      `SELECT id, name, price FROM "ServiceCatalogItem"
        WHERE "tenantId" = $1 AND "isActive" = true AND id = ANY($2::text[]) FOR SHARE`,
      [input.ctx.tenantId, ids],
    );
    if (catalog.rows.length !== new Set(ids).size) throw new Error("Katalog tidak ditemukan dalam tenant ini.");
    const byId = new Map(catalog.rows.map((item) => [item.id, item]));
    const total = input.items.reduce((sum, item) => sum + Number(byId.get(item.catalogItemId)!.price) * item.quantity, 0);
    const saleId = `svc_${crypto.randomUUID()}`;
    await client.query(
      `INSERT INTO "ServiceSale" (id, "tenantId", "staffId", total, "paymentMethod") VALUES ($1,$2,$3,$4,$5)`,
      [saleId, input.ctx.tenantId, input.staffId ?? null, total, input.paymentMethod],
    );
    for (const item of input.items) {
      const catalogItem = byId.get(item.catalogItemId)!;
      await client.query(
        `INSERT INTO "ServiceSaleItem" (id, "tenantId", "saleId", "catalogItemId", name, price, quantity, subtotal) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
        [`svci_${crypto.randomUUID()}`, input.ctx.tenantId, saleId, item.catalogItemId, catalogItem.name, catalogItem.price, item.quantity, Number(catalogItem.price) * item.quantity],
      );
    }
    await client.query(
      `INSERT INTO "ServiceCheckoutRequest" (id, "tenantId", "requestId", "saleId") VALUES ($1,$2,$3,$4)`,
      [`svcr_${crypto.randomUUID()}`, input.ctx.tenantId, input.requestId, saleId],
    );
    await client.query("COMMIT");
    return { id: saleId, idempotent: false, total };
  } catch (error) { await client.query("ROLLBACK"); throw error; }
  finally { client.release(); }
}
