import { db } from "./db";

export type MarketMember = {
  id: string;
  tenantId: string;
  name: string;
  phone: string;
  email: string | null;
  points: number;
  depositBalance: number;
  createdAt: string;
};

export async function listMarketMembers(tenantId: string): Promise<MarketMember[]> {
  const result = await db.query<{
    id: string;
    tenant_id: string;
    name: string;
    phone: string;
    email: string | null;
    points: number;
    deposit_balance: number;
    created_at: Date;
  }>(
    `SELECT id, "tenantId" AS tenant_id, name, phone, email, points, "depositBalance" AS deposit_balance, "createdAt" AS created_at
       FROM "Member"
      WHERE "tenantId" = $1
      ORDER BY name ASC`,
    [tenantId]
  );

  return result.rows.map((row) => ({
    id: row.id,
    tenantId: row.tenant_id,
    name: row.name,
    phone: row.phone,
    email: row.email,
    points: Number(row.points),
    depositBalance: Number(row.deposit_balance),
    createdAt: row.created_at.toISOString(),
  }));
}

export async function createMarketMember(data: {
  tenantId: string;
  name: string;
  phone: string;
  email?: string;
}): Promise<void> {
  const id = `MBR-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  await db.query(
    `INSERT INTO "Member" (id, "tenantId", name, phone, email)
     VALUES ($1, $2, $3, $4, $5)`,
    [id, data.tenantId, data.name, data.phone, data.email || null]
  );
}
