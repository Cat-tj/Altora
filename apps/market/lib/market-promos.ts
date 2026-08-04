import { db } from "./db";

export type MarketPromo = {
  id: string;
  tenantId: string;
  name: string;
  discountPercent: number | null;
  discountAmount: number | null;
  minPurchase: number;
  ruleType: "DISCOUNT" | "BOGO" | "BULK" | string | null;
  qualifyingQty: number | null;
  rewardQty: number | null;
  qualifyingProductId: string | null;
  qualifyingCategoryId: string | null;
  rewardProductId: string | null;
  rewardCategoryId: string | null;
  rewardDiscountPercent: number | null;
  maxRewardQty: number | null;
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
    rule_type: string | null;
    qualifying_qty: number | null;
    reward_qty: number | null;
    qualifying_product_id: string | null;
    qualifying_category_id: string | null;
    reward_product_id: string | null;
    reward_category_id: string | null;
    reward_discount_percent: number | null;
    max_reward_qty: number | null;
    is_active: boolean;
    created_at: Date;
  }>(
    `SELECT id, "tenantId" AS tenant_id, name,
            COALESCE("discountPercent", CASE WHEN "discountType"::text IN ('PERCENTAGE', 'PERCENT') THEN "discountValue" ELSE NULL END) AS discount_percent,
            COALESCE("discountAmount", CASE WHEN "discountType"::text IN ('FIXED_AMOUNT', 'FIXED') THEN "discountValue" ELSE NULL END) AS discount_amount,
            COALESCE("minPurchase", "minSpend", 0) AS min_purchase,
            "ruleType" AS rule_type,
            "qualifyingQty" AS qualifying_qty,
            "rewardQty" AS reward_qty,
            "qualifyingProductId" AS qualifying_product_id,
            "qualifyingCategoryId" AS qualifying_category_id,
            "rewardProductId" AS reward_product_id,
            "rewardCategoryId" AS reward_category_id,
            "rewardDiscountPercent" AS reward_discount_percent,
            "maxRewardQty" AS max_reward_qty,
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
    ruleType: row.rule_type,
    qualifyingQty: row.qualifying_qty !== null ? Number(row.qualifying_qty) : null,
    rewardQty: row.reward_qty !== null ? Number(row.reward_qty) : null,
    qualifyingProductId: row.qualifying_product_id,
    qualifyingCategoryId: row.qualifying_category_id,
    rewardProductId: row.reward_product_id,
    rewardCategoryId: row.reward_category_id,
    rewardDiscountPercent: row.reward_discount_percent !== null ? Number(row.reward_discount_percent) : null,
    maxRewardQty: row.max_reward_qty !== null ? Number(row.max_reward_qty) : null,
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
  ruleType?: string;
  qualifyingQty?: number;
  rewardQty?: number;
  qualifyingProductId?: string;
  qualifyingCategoryId?: string;
  rewardProductId?: string;
  rewardCategoryId?: string;
  rewardDiscountPercent?: number;
  maxRewardQty?: number;
}): Promise<void> {
  const id = `PRM-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  await db.query(
    `INSERT INTO "Promo" (id, "tenantId", name, "discountType", "discountValue",
                          "discountPercent", "discountAmount", "minPurchase", "ruleType",
                          "qualifyingQty", "rewardQty", "qualifyingProductId",
                          "qualifyingCategoryId", "rewardProductId", "rewardCategoryId",
                          "rewardDiscountPercent", "maxRewardQty", "isActive",
                          "startTime", "endTime", "updatedAt")
     VALUES ($1, $2, $3, 'PERCENT', 0, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, true, '00:00', '23:59', CURRENT_TIMESTAMP)`,
    [
      id, data.tenantId, data.name,
      data.discountPercent ?? null, data.discountAmount ?? null,
      data.minPurchase ?? 0, data.ruleType ?? "DISCOUNT",
      data.qualifyingQty ?? null, data.rewardQty ?? null,
      data.qualifyingProductId ?? null, data.qualifyingCategoryId ?? null,
      data.rewardProductId ?? null, data.rewardCategoryId ?? null,
      data.rewardDiscountPercent ?? null, data.maxRewardQty ?? null,
    ]
  );
}
