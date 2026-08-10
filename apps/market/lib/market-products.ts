import { db } from "./db";
import type { MarketRole } from "./market-user";

export type MarketProduct = {
  id: string;
  name: string;
  sku: string | null;
  category: string;
  categoryId: string | null;
  price: number;
  cost: number | null;
  stock: number;
  trackExpiry: boolean;
  expiredAt: string | null;
};

export type MarketCategory = { id: string; name: string };

export async function listMarketCategories(tenantId: string): Promise<MarketCategory[]> {
  const result = await db.query<{ id: string; name: string }>(
    `SELECT id, name FROM "Category" WHERE "tenantId" = $1 ORDER BY name ASC`,
    [tenantId],
  );
  return result.rows;
}

export async function listMarketProducts(
  tenantId: string,
  userId: string,
  role: MarketRole,
): Promise<MarketProduct[]> {
  const outletCondition =
    role === "OWNER"
      ? 'o."tenantId" = $1 AND $2::text IS NOT NULL'
      : 'o."tenantId" = $1 AND EXISTS (SELECT 1 FROM "UserOutlet" uo WHERE uo."outletId" = o.id AND uo."userId" = $2)';
  const result = await db.query<{
    id: string;
    name: string;
    sku: string | null;
    category: string | null;
    categoryId: string | null;
    price: string;
    cost: string | null;
    stock: string;
    trackExpiry: boolean;
    expiredAt: Date | null;
  }>(
    `WITH outlets AS (SELECT o.id FROM "Outlet" o WHERE ${outletCondition} AND o."isActive" = true)
     SELECT 
       p.id, 
       p.name, 
       p.sku, 
       c.name AS category, 
       p."categoryId", 
       p.price::text, 
       p.cost::text, 
       COALESCE(SUM(ps.qty), 0)::text AS stock,
       COALESCE(p."trackExpiry", false) AS "trackExpiry",
       p."expiredAt"
     FROM "Product" p
     LEFT JOIN "Category" c ON c.id = p."categoryId"
     LEFT JOIN "ProductStock" ps ON ps."productId" = p.id AND ps."outletId" IN (SELECT id FROM outlets)
     WHERE p."tenantId" = $1 AND p."isActive" = true AND p.kind = 'GOODS'
     GROUP BY p.id, p.name, p.sku, c.name, p."categoryId", p.price, p.cost, p."trackExpiry", p."expiredAt"
     ORDER BY p.name ASC`,
    [tenantId, userId],
  );
  return result.rows.map((row) => ({
    id: row.id,
    name: row.name,
    sku: row.sku,
    category: row.category ?? "Tanpa kategori",
    categoryId: row.categoryId,
    price: Number(row.price),
    cost: row.cost ? Number(row.cost) : null,
    stock: Number(row.stock),
    trackExpiry: Boolean(row.trackExpiry),
    expiredAt: row.expiredAt ? new Date(row.expiredAt).toISOString() : null,
  }));
}

export async function createMarketProduct(data: {
  tenantId: string;
  name: string;
  sku?: string;
  categoryId?: string;
  price: number;
  cost?: number;
  imageUrl?: string;
  trackStock?: boolean;
  trackExpiry?: boolean;
  expiredAt?: string | null;
}): Promise<{ id: string }> {
  const id = `prod_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  const trackExpiry = data.trackExpiry ?? Boolean(data.expiredAt);
  await db.query(
    `INSERT INTO "Product" (
       id, "tenantId", "categoryId", name, sku, price, cost, "imageUrl", 
       "trackStock", "isActive", kind, "trackExpiry", "expiredAt", "trackSerial", "createdAt", "updatedAt"
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, true, 'GOODS', $10, $11, false, NOW(), NOW())`,
    [
      id,
      data.tenantId,
      data.categoryId || null,
      data.name,
      data.sku || null,
      data.price,
      data.cost ?? null,
      data.imageUrl || null,
      data.trackStock ?? true,
      trackExpiry,
      data.expiredAt ? new Date(data.expiredAt) : null,
    ],
  );
  return { id };
}

export async function updateMarketProduct(data: {
  id: string;
  tenantId: string;
  name: string;
  sku?: string;
  categoryId?: string;
  price: number;
  cost?: number;
  trackExpiry?: boolean;
  expiredAt?: string | null;
}): Promise<void> {
  const trackExpiry = data.trackExpiry ?? Boolean(data.expiredAt);
  await db.query(
    `UPDATE "Product" 
     SET name = $3,
         sku = $4,
         "categoryId" = $5,
         price = $6,
         cost = $7,
         "trackExpiry" = $8,
         "expiredAt" = $9,
         "updatedAt" = NOW()
     WHERE id = $1 AND "tenantId" = $2`,
    [
      data.id,
      data.tenantId,
      data.name,
      data.sku || null,
      data.categoryId || null,
      data.price,
      data.cost ?? null,
      trackExpiry,
      data.expiredAt ? new Date(data.expiredAt) : null,
    ],
  );
}

export async function deleteMarketProduct(id: string, tenantId: string): Promise<void> {
  await db.query(
    `UPDATE "Product" SET "isActive" = false, "updatedAt" = NOW() WHERE id = $1 AND "tenantId" = $2`,
    [id, tenantId],
  );
}
