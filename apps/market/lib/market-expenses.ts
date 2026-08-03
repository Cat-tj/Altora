import { db } from "./db";

export type ExpenseCategory = "RENT" | "UTILITIES" | "SALARY" | "SUPPLIES" | "MARKETING" | "TRANSPORT" | "EVENT" | "OTHER";

export type MarketExpense = {
  id: string;
  tenantId: string;
  outletId: string;
  outletName?: string;
  category: string;
  amount: number;
  description: string | null;
  createdByName?: string;
  createdAt: string;
};

export async function listMarketExpenses(tenantId: string): Promise<MarketExpense[]> {
  const result = await db.query<{
    id: string;
    tenant_id: string;
    outlet_id: string;
    outlet_name: string;
    category: string;
    amount: number;
    description: string | null;
    created_by_name: string;
    created_at: Date;
  }>(
    `SELECT e.id,
            e."tenantId" AS tenant_id,
            e."outletId" AS outlet_id,
            o.name AS outlet_name,
            e.category,
            e.amount,
            e.description,
            u.name AS created_by_name,
            e."createdAt" AS created_at
       FROM "Expense" e
       JOIN "Outlet" o ON o.id = e."outletId"
       JOIN "User" u ON u.id = e."createdById"
      WHERE e."tenantId" = $1
      ORDER BY e."createdAt" DESC`,
    [tenantId]
  );

  return result.rows.map((row) => ({
    id: row.id,
    tenantId: row.tenant_id,
    outletId: row.outlet_id,
    outletName: row.outlet_name,
    category: row.category,
    amount: Number(row.amount),
    description: row.description,
    createdByName: row.created_by_name,
    createdAt: row.created_at.toISOString(),
  }));
}

export async function createMarketExpense(data: {
  tenantId: string;
  outletId: string;
  category: string;
  amount: number;
  description?: string;
  createdById: string;
}): Promise<void> {
  const id = `EXP-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  await db.query(
    `INSERT INTO "Expense" (id, "tenantId", "outletId", category, amount, description, "createdById")
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [id, data.tenantId, data.outletId, data.category, data.amount, data.description || null, data.createdById]
  );
}
