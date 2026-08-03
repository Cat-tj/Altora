import { db } from "./db";

export type GiftCardRecord = {
  id: string;
  tenantId: string;
  code: string;
  initialValue: number;
  balance: number;
  isActive: boolean;
  createdAt: string;
};

export async function listGiftCards(tenantId: string): Promise<GiftCardRecord[]> {
  const result = await db.query<{
    id: string;
    tenant_id: string;
    code: string;
    initial_value: number;
    balance: number;
    is_active: boolean;
    created_at: Date;
  }>(
    `SELECT id, "tenantId" AS tenant_id, code, "initialValue" AS initial_value, balance, "isActive" AS is_active, "createdAt" AS created_at
       FROM "GiftCard"
      WHERE "tenantId" = $1
      ORDER BY "createdAt" DESC`,
    [tenantId]
  );

  return result.rows.map((row) => ({
    id: row.id,
    tenantId: row.tenant_id,
    code: row.code,
    initialValue: Number(row.initial_value),
    balance: Number(row.balance),
    isActive: row.is_active,
    createdAt: row.created_at.toISOString(),
  }));
}

export async function createGiftCard(data: {
  tenantId: string;
  code: string;
  initialValue: number;
}): Promise<void> {
  const id = `VCH-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  await db.query(
    `INSERT INTO "GiftCard" (id, "tenantId", code, "initialValue", balance)
     VALUES ($1, $2, $3, $4, $4)`,
    [id, data.tenantId, data.code.toUpperCase().trim(), data.initialValue]
  );
}
