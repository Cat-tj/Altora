import { db } from "./db";

export type MarketReportSummary = {
  grossSales: number;
  totalReturns: number;
  netSales: number;
  totalExpenses: number;
  netProfit: number;
  transactionCount: number;
};

export async function getMarketReportSummary(tenantId: string): Promise<MarketReportSummary> {
  const salesResult = await db.query<{ total: string; count: string }>(
    `SELECT COALESCE(SUM(total), 0)::text AS total, COUNT(*)::text AS count
       FROM "Sale"
      WHERE "tenantId" = $1 AND status = 'COMPLETED'`,
    [tenantId]
  );
  const grossSales = Number(salesResult.rows[0]?.total || 0);
  const transactionCount = Number(salesResult.rows[0]?.count || 0);

  const returnsResult = await db.query<{ total: string }>(
    `SELECT COALESCE(SUM("refundAmount"), 0)::text AS total
       FROM "SaleReturn"
      WHERE "tenantId" = $1`,
    [tenantId]
  );
  const totalReturns = Number(returnsResult.rows[0]?.total || 0);

  const expensesResult = await db.query<{ total: string }>(
    `SELECT COALESCE(SUM(amount), 0)::text AS total
       FROM "Expense"
      WHERE "tenantId" = $1`,
    [tenantId]
  );
  const totalExpenses = Number(expensesResult.rows[0]?.total || 0);

  const netSales = grossSales - totalReturns;
  const netProfit = netSales - totalExpenses;

  return {
    grossSales,
    totalReturns,
    netSales,
    totalExpenses,
    netProfit,
    transactionCount,
  };
}
