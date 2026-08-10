import { db } from "@altora/db/pool";

// ── Types ──────────────────────────────────────────────────

export type DailySummary = {
  date: string;
  totalOrders: number;
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  avgOrderValue: number;
};

export type SalesByPeriod = {
  period: string;
  totalSales: number;
  orderCount: number;
  avgOrderValue: number;
};

export type ProfitMargin = {
  totalRevenue: number;
  totalCost: number;
  grossProfit: number;
  grossMarginPercent: number;
};

export type BestSeller = {
  productId: string;
  productName: string;
  totalQty: number;
  totalRevenue: number;
  orderCount: number;
};

export type SalesReport = {
  summary: DailySummary;
  salesByPeriod: SalesByPeriod[];
  profitMargin: ProfitMargin;
  bestSellers: BestSeller[];
};

// ── Reports ────────────────────────────────────────────────

/**
 * Ringkasan penjualan harian untuk tenant.
 */
export async function getDailySummary(
  tenantId: string,
  date?: string,
): Promise<DailySummary> {
  const targetDate = date ?? new Date().toISOString().slice(0, 10);

  const orderResult = await db.query<{
    total_orders: string;
    total_revenue: string;
    avg_order_value: string;
  }>(
    `SELECT
       COUNT(*)::text AS total_orders,
       COALESCE(SUM(total), 0)::text AS total_revenue,
       COALESCE(AVG(total), 0)::text AS avg_order_value
     FROM "TableOrder"
     WHERE "tenantId" = $1
       AND DATE("createdAt") = $2
       AND status = 'COMPLETED'`,
    [tenantId, targetDate],
  );

  const expenseResult = await db.query<{ total_expenses: string }>(
    `SELECT COALESCE(SUM(amount), 0)::text AS total_expenses
     FROM "Expense"
     WHERE "tenantId" = $1
       AND DATE("createdAt") = $2`,
    [tenantId, targetDate],
  );

  const totalOrders = Number(orderResult.rows[0]?.total_orders ?? 0);
  const totalRevenue = Number(orderResult.rows[0]?.total_revenue ?? 0);
  const avgOrderValue = Number(orderResult.rows[0]?.avg_order_value ?? 0);
  const totalExpenses = Number(expenseResult.rows[0]?.total_expenses ?? 0);
  const netProfit = totalRevenue - totalExpenses;

  return {
    date: targetDate,
    totalOrders,
    totalRevenue,
    totalExpenses,
    netProfit,
    avgOrderValue,
  };
}

/**
 * Penjualan per periode (harian selama N hari terakhir).
 */
export async function getSalesByPeriod(
  tenantId: string,
  days: number = 7,
): Promise<SalesByPeriod[]> {
  const result = await db.query<{
    period: string;
    total_sales: string;
    order_count: string;
    avg_order_value: string;
  }>(
    `SELECT
       TO_CHAR(DATE("createdAt"), 'YYYY-MM-DD') AS period,
       COALESCE(SUM(total), 0)::text AS total_sales,
       COUNT(*)::text AS order_count,
       COALESCE(AVG(total), 0)::text AS avg_order_value
     FROM "TableOrder"
     WHERE "tenantId" = $1
       AND status = 'COMPLETED'
       AND "createdAt" >= NOW() - INTERVAL '1 day' * $2
     GROUP BY DATE("createdAt")
     ORDER BY period DESC`,
    [tenantId, days],
  );

  return result.rows.map((r) => ({
    period: r.period,
    totalSales: Number(r.total_sales),
    orderCount: Number(r.order_count),
    avgOrderValue: Number(r.avg_order_value),
  }));
}

/**
 * Margin keuntungan berdasarkan harga jual vs harga beli bahan.
 * Margin = (Revenue - Harga Beli Bahan) / Revenue * 100
 */
export async function getProfitMargin(
  tenantId: string,
  date?: string,
): Promise<ProfitMargin> {
  const targetDate = date ?? new Date().toISOString().slice(0, 10);

  // Total revenue dari pesanan selesai
  const revenueResult = await db.query<{ total: string }>(
    `SELECT COALESCE(SUM(total), 0)::text AS total
     FROM "TableOrder"
     WHERE "tenantId" = $1
       AND DATE("createdAt") = $2
       AND status = 'COMPLETED'`,
    [tenantId, targetDate],
  );

  // Total biaya bahan baku dari resep yang terjual
  const costResult = await db.query<{ total_cost: string }>(
    `SELECT COALESCE(SUM(ri.qty * ing.price), 0)::text AS total_cost
     FROM "TableOrderItem" toi
     JOIN "TableOrder" o ON o.id = toi."orderId"
     JOIN "ProductRecipeItem" pri ON pri."productId" = toi."productId"
     JOIN "Product" ing ON ing.id = pri."ingredientProductId"
     WHERE o."tenantId" = $1
       AND DATE(o."createdAt") = $2
       AND o.status = 'COMPLETED'`,
    [tenantId, targetDate],
  );

  const totalRevenue = Number(revenueResult.rows[0]?.total ?? 0);
  const totalCost = Number(costResult.rows[0]?.total_cost ?? 0);
  const grossProfit = totalRevenue - totalCost;
  const grossMarginPercent =
    totalRevenue > 0 ? Math.round((grossProfit / totalRevenue) * 10000) / 100 : 0;

  return {
    totalRevenue,
    totalCost,
    grossProfit,
    grossMarginPercent,
  };
}

/**
 * Menu terlaris berdasarkan quantity terjual.
 */
export async function getBestSellers(
  tenantId: string,
  days: number = 30,
  limit: number = 10,
): Promise<BestSeller[]> {
  const result = await db.query<{
    product_id: string;
    product_name: string;
    total_qty: string;
    total_revenue: string;
    order_count: string;
  }>(
    `SELECT
       toi."productId" AS product_id,
       toi."productName" AS product_name,
       SUM(toi.qty)::text AS total_qty,
       SUM(toi.qty * toi.price)::text AS total_revenue,
       COUNT(DISTINCT toi."orderId")::text AS order_count
     FROM "TableOrderItem" toi
     JOIN "TableOrder" o ON o.id = toi."orderId"
     WHERE o."tenantId" = $1
       AND o.status = 'COMPLETED'
       AND o."createdAt" >= NOW() - INTERVAL '1 day' * $2
     GROUP BY toi."productId", toi."productName"
     ORDER BY total_qty DESC
     LIMIT $3`,
    [tenantId, days, limit],
  );

  return result.rows.map((r) => ({
    productId: r.product_id,
    productName: r.product_name,
    totalQty: Number(r.total_qty),
    totalRevenue: Number(r.total_revenue),
    orderCount: Number(r.order_count),
  }));
}

/**
 * Laporan lengkap untuk halaman analytics.
 */
export async function getRestoSalesReport(
  tenantId: string,
  date?: string,
  periodDays: number = 7,
): Promise<SalesReport> {
  const [summary, salesByPeriod, profitMargin, bestSellers] = await Promise.all([
    getDailySummary(tenantId, date),
    getSalesByPeriod(tenantId, periodDays),
    getProfitMargin(tenantId, date),
    getBestSellers(tenantId),
  ]);

  return { summary, salesByPeriod, profitMargin, bestSellers };
}
