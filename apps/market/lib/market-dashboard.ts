import { db } from "./db";
import type { MarketRole } from "./market-user";

type DashboardInput = { tenantId: string; userId: string; role: MarketRole };

export type SalesTrendPoint = {
  date: string;
  fullDate: string;
  omzet: number;
  transactions: number;
};

export type MarketDashboardAlert = {
  id: string;
  productName: string;
  qty: number;
  minQty: number;
  title: string;
  body: string;
  href: string;
};

export type MarketDashboard = {
  todaySales: number;
  yesterdaySales: number;
  transactionCount: number;
  averageTransaction: number;
  openShiftCount: number;
  salesTrend: SalesTrendPoint[];
  alerts: MarketDashboardAlert[];
  topProducts: { name: string; quantity: number; omzet: number }[];
};

export async function getMarketDashboard({ tenantId, userId, role }: DashboardInput): Promise<MarketDashboard> {
  const outletCondition = role === "OWNER" ? "o.\"tenantId\" = $1 AND $2::text IS NOT NULL" : "o.\"tenantId\" = $1 AND EXISTS (SELECT 1 FROM \"UserOutlet\" uo WHERE uo.\"outletId\" = o.id AND uo.\"userId\" = $2)";
  const values = [tenantId, userId];
  
  const [summaryResult, topProductResult, alertResult, trendResult] = await Promise.all([
    db.query<{ today_sales: string; yesterday_sales: string; transaction_count: string; open_shifts: string }>(
      `WITH outlets AS (SELECT o.id FROM "Outlet" o WHERE ${outletCondition} AND o."isActive" = true)
       SELECT
         COALESCE(SUM(s.total) FILTER (WHERE s."createdAt" >= date_trunc('day', now() AT TIME ZONE 'Asia/Jakarta') AT TIME ZONE 'Asia/Jakarta'), 0)::text AS today_sales,
         COALESCE(SUM(s.total) FILTER (WHERE s."createdAt" >= date_trunc('day', now() AT TIME ZONE 'Asia/Jakarta') AT TIME ZONE 'Asia/Jakarta' - interval '1 day' AND s."createdAt" < date_trunc('day', now() AT TIME ZONE 'Asia/Jakarta') AT TIME ZONE 'Asia/Jakarta'), 0)::text AS yesterday_sales,
         COUNT(s.id) FILTER (WHERE s."createdAt" >= date_trunc('day', now() AT TIME ZONE 'Asia/Jakarta') AT TIME ZONE 'Asia/Jakarta')::text AS transaction_count,
         (SELECT COUNT(*) FROM "CashierShift" cs WHERE cs."tenantId" = $1 AND cs.status = 'OPEN' AND cs."outletId" IN (SELECT id FROM outlets))::text AS open_shifts
       FROM "Sale" s
       WHERE s."tenantId" = $1 AND s.status = 'COMPLETED' AND s."outletId" IN (SELECT id FROM outlets)`,
      values,
    ).catch(() => ({ rows: [] })),
    db.query<{ name: string; quantity: string; omzet: string }>(
      `WITH outlets AS (SELECT o.id FROM "Outlet" o WHERE ${outletCondition} AND o."isActive" = true)
       SELECT si."productName" AS name, SUM(si.qty)::text AS quantity, SUM(si.subtotal)::text AS omzet
       FROM "SaleItem" si
       INNER JOIN "Sale" s ON s.id = si."saleId"
       WHERE s."tenantId" = $1 AND s.status = 'COMPLETED' AND s."outletId" IN (SELECT id FROM outlets)
         AND s."createdAt" >= date_trunc('day', now() AT TIME ZONE 'Asia/Jakarta') AT TIME ZONE 'Asia/Jakarta'
       GROUP BY si."productName"
       ORDER BY SUM(si.subtotal) DESC
       LIMIT 5`,
      values,
    ).catch(() => ({ rows: [] })),
    db.query<{ id: string; name: string; qty: string; min_qty: string }>(
      `WITH outlets AS (SELECT o.id FROM "Outlet" o WHERE ${outletCondition} AND o."isActive" = true)
       SELECT ps.id, p.name, ps.qty::text, COALESCE(rp."minQty", 5)::text AS min_qty
       FROM "ProductStock" ps
       INNER JOIN "Product" p ON p.id = ps."productId" AND p."tenantId" = $1
       LEFT JOIN "StockReorderPoint" rp ON rp."productId" = ps."productId" AND rp."outletId" = ps."outletId"
       WHERE ps."tenantId" = $1 AND ps."outletId" IN (SELECT id FROM outlets)
         AND p."isActive" = true AND p.kind = 'GOODS' AND ps.qty <= COALESCE(rp."minQty", 5)
       ORDER BY ps.qty ASC, p.name ASC
       LIMIT 5`,
      values,
    ).catch(() => ({ rows: [] })),
    db.query<{ full_date: string; date_label: string; omzet: string; transactions: string }>(
      `WITH outlets AS (SELECT o.id FROM "Outlet" o WHERE ${outletCondition} AND o."isActive" = true),
       dates AS (
         SELECT generate_series(
           (now() AT TIME ZONE 'Asia/Jakarta')::date - interval '6 days',
           (now() AT TIME ZONE 'Asia/Jakarta')::date,
           interval '1 day'
         )::date AS d
       )
       SELECT
         to_char(d.d, 'YYYY-MM-DD') AS full_date,
         to_char(d.d, 'FMDD Mon') AS date_label,
         COALESCE(SUM(s.total), 0)::text AS omzet,
         COUNT(s.id)::text AS transactions
       FROM dates d
       LEFT JOIN "Sale" s ON s."tenantId" = $1
         AND s.status = 'COMPLETED'
         AND s."outletId" IN (SELECT id FROM outlets)
         AND (s."createdAt" AT TIME ZONE 'Asia/Jakarta')::date = d.d
       GROUP BY d.d
       ORDER BY d.d ASC`,
      values,
    ).catch(() => ({ rows: [] })),
  ]);

  const summary = summaryResult.rows[0] ?? { today_sales: "0", yesterday_sales: "0", transaction_count: "0", open_shifts: "0" };
  const todaySales = Number(summary.today_sales);
  const transactionCount = Number(summary.transaction_count);

  let salesTrend: SalesTrendPoint[] = (trendResult.rows || []).map((row) => ({
    date: row.date_label,
    fullDate: row.full_date,
    omzet: Number(row.omzet),
    transactions: Number(row.transactions),
  }));

  // Fallback 7 days timeline if empty or DB disconnected
  if (!salesTrend.length) {
    const months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
    const today = new Date();
    salesTrend = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(today);
      d.setDate(d.getDate() - (6 - i));
      const dateLabel = `${d.getDate()} ${months[d.getMonth()]}`;
      const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      return {
        date: dateLabel,
        fullDate: iso,
        omzet: i === 6 ? todaySales : 0,
        transactions: i === 6 ? transactionCount : 0,
      };
    });
  }

  return {
    todaySales,
    yesterdaySales: Number(summary.yesterday_sales),
    transactionCount,
    averageTransaction: transactionCount ? Math.round(todaySales / transactionCount) : 0,
    openShiftCount: Number(summary.open_shifts),
    salesTrend,
    alerts: alertResult.rows.map((item) => ({
      id: item.id,
      productName: item.name,
      qty: Number(item.qty),
      minQty: Number(item.min_qty),
      title: `${item.name} stok menipis`,
      body: `Sisa ${item.qty}; batas minimum ${item.min_qty}.`,
      href: "/produk",
    })),
    topProducts: topProductResult.rows.map((item) => ({
      name: item.name,
      quantity: Number(item.quantity),
      omzet: Number(item.omzet),
    })),
  };
}
