import { db } from "./db";

export type RestoDashboardSummary = {
  totalTables: number;
  occupiedTables: number;
  availableTables: number;
  preparingOrdersCount: number;
  completedOrdersToday: number;
};

export async function getRestoDashboard(tenantId: string): Promise<RestoDashboardSummary> {
  const tableResult = await db.query<{ status: string; count: string }>(
    `SELECT status, COUNT(*) as count 
       FROM "Table" 
      WHERE "tenantId" = $1 
      GROUP BY status`,
    [tenantId]
  );

  let totalTables = 0;
  let occupiedTables = 0;
  let availableTables = 0;

  for (const row of tableResult.rows) {
    const count = Number(row.count);
    totalTables += count;
    if (row.status === "OCCUPIED") occupiedTables = count;
    if (row.status === "AVAILABLE") availableTables = count;
  }

  const orderResult = await db.query<{ status: string; count: string }>(
    `SELECT status, COUNT(*) as count 
       FROM "TableOrder" 
      WHERE "tenantId" = $1 AND "createdAt" >= CURRENT_DATE 
      GROUP BY status`,
    [tenantId]
  );

  let preparingOrdersCount = 0;
  let completedOrdersToday = 0;

  for (const row of orderResult.rows) {
    const count = Number(row.count);
    if (row.status === "PREPARING" || row.status === "PENDING") {
      preparingOrdersCount += count;
    }
    if (row.status === "COMPLETED") {
      completedOrdersToday = count;
    }
  }

  return {
    totalTables,
    occupiedTables,
    availableTables,
    preparingOrdersCount,
    completedOrdersToday,
  };
}
