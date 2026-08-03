import { db } from "./db";

export type MarketPromo = {
  id: string;
  tenantId: string;
  name: string;
  discountPercent: number | null;
  discountAmount: number | null;
  minPurchase: number;
  isActive: boolean;
  createdAt: string;
};

export async function listMarketPromos(tenantId: string): Promise<MarketPromo[]> {
  const result = await db.query<{
    id: string;
    tenant_id: string;
    name: string;
    discount_percent: number | null;
    discount_amount: number | null;
    min_purchase: number;
    is_active: boolean;
    created_at: Date;
  }>(
    `SELECT id, "tenantId" AS tenant_id, name,
            COALESCE("discountPercent", CASE WHEN "discountType" IN ('PERCENTAGE', 'PERCENT') THEN "discountValue" ELSE NULL END) AS discount_percent,
            COALESCE("discountAmount", CASE WHEN "discountType" IN ('FIXED_AMOUNT', 'FIXED') THEN "discountValue" ELSE NULL END) AS discount_amount,
            COALESCE("minPurchase", "minSpend", 0) AS min_purchase,
            "isActive" AS is_active,
            "createdAt" AS created_at
       FROM "Promo"
      WHERE "tenantId" = $1
      ORDER BY "createdAt" DESC`,
    [tenantId]
  );

  return result.rows.map((row) => ({
    id: row.id,
    tenantId: row.tenant_id,
    name: row.name,
    discountPercent: row.discount_percent !== null ? Number(row.discount_percent) : null,
    discountAmount: row.discount_amount !== null ? Number(row.discount_amount) : null,
    minPurchase: Number(row.min_purchase),
    isActive: row.is_active,
    createdAt: row.created_at.toISOString(),
  }));
}

export async function createMarketPromo(data: {
  tenantId: string;
  name: string;
  discountPercent?: number;
  discountAmount?: number;
  minPurchase?: number;
}): Promise<void> {
  const id = `PRM-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  await db.query(
    `INSERT INTO "Promo" (id, "tenantId", name, "discountPercent", "discountAmount", "minPurchase")
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [id, data.tenantId, data.name, data.discountPercent || null, data.discountAmount || null, data.minPurchase || 0]
  );
}
