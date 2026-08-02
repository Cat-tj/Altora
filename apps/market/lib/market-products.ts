import { db } from "./db";
import type { MarketRole } from "./market-user";

export type MarketProduct = { id: string; name: string; sku: string | null; category: string; price: number; stock: number };

export async function listMarketProducts(tenantId: string, userId: string, role: MarketRole): Promise<MarketProduct[]> {
  const outletCondition = role === "OWNER" ? "o.\"tenantId\" = $1 AND $2::text IS NOT NULL" : "o.\"tenantId\" = $1 AND EXISTS (SELECT 1 FROM \"UserOutlet\" uo WHERE uo.\"outletId\" = o.id AND uo.\"userId\" = $2)";
  const result = await db.query<{ id: string; name: string; sku: string | null; category: string | null; price: string; stock: string }>(
    `WITH outlets AS (SELECT o.id FROM "Outlet" o WHERE ${outletCondition} AND o."isActive" = true)
     SELECT p.id, p.name, p.sku, c.name AS category, p.price::text, COALESCE(SUM(ps.qty), 0)::text AS stock
     FROM "Product" p
     LEFT JOIN "Category" c ON c.id = p."categoryId"
     LEFT JOIN "ProductStock" ps ON ps."productId" = p.id AND ps."outletId" IN (SELECT id FROM outlets)
     WHERE p."tenantId" = $1 AND p."isActive" = true AND p.kind = 'GOODS'
     GROUP BY p.id, p.name, p.sku, c.name, p.price
     ORDER BY p.name ASC`,
    [tenantId, userId],
  );
  return result.rows.map((row) => ({ id: row.id, name: row.name, sku: row.sku, category: row.category ?? "Tanpa kategori", price: Number(row.price), stock: Number(row.stock) }));
}
