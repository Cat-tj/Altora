import { db } from "./db";
import type { MarketRole } from "./market-user";

type DashboardInput = { tenantId: string; userId: string; role: MarketRole };

export type MarketDashboard = {
  todaySales: number;
  yesterdaySales: number;
  transactionCount: number;
  averageTransaction: number;
  openShiftCount: number;
  alerts: { id: string; title: string; body: string; href: string }[];
  topProducts: { name: string; quantity: number; omzet: number }[];
  /* ── Phase 1 additions ─────────────────────────────────── */
  salesTrend: { date: string; omzet: number; transactions: number }[];
  stockHealth: { total: number; safe: number; low: number; out: number };
  paymentBreakdown: { method: string; amount: number; count: number }[];
  cashierActivity: { shiftId: string; cashierName: string; openedAt: string; lastSaleAt: string | null; transactionCount: number }[];
};

/* Reusable outlet CTE — keeps all queries tenant + branch scoped */
function outletCTE(outletCondition: string) {
  return `WITH outlets AS (SELECT o.id FROM "Outlet" o WHERE ${outletCondition} AND o."isActive" = true)`;
}

export async function getMarketDashboard({ tenantId, userId, role }: DashboardInput): Promise<MarketDashboard> {
  const outletCondition =
    role === "OWNER"
      ? `o."tenantId" = $1 AND $2::text IS NOT NULL`
      : `o."tenantId" = $1 AND EXISTS (SELECT 1 FROM "UserOutlet" uo WHERE uo."outletId" = o.id AND uo."userId" = $2)`;
  const values = [tenantId, userId];
  const oCTE = outletCTE(outletCondition);

  const [summaryResult, topProductResult, alertResult, trendResult, stockResult, paymentResult, cashierResult] =
    await Promise.all([
      /* ── 1. Summary (existing) ─────────────────────────── */
      db.query<{ today_sales: string; yesterday_sales: string; transaction_count: string; open_shifts: string }>(
        `${oCTE}
         SELECT
           COALESCE(SUM(s.total) FILTER (WHERE s."createdAt" >= date_trunc('day', now() AT TIME ZONE 'Asia/Jakarta') AT TIME ZONE 'Asia/Jakarta'), 0)::text AS today_sales,
           COALESCE(SUM(s.total) FILTER (WHERE s."createdAt" >= date_trunc('day', now() AT TIME ZONE 'Asia/Jakarta') AT TIME ZONE 'Asia/Jakarta' - interval '1 day' AND s."createdAt" < date_trunc('day', now() AT TIME ZONE 'Asia/Jakarta') AT TIME ZONE 'Asia/Jakarta'), 0)::text AS yesterday_sales,
           COUNT(s.id) FILTER (WHERE s."createdAt" >= date_trunc('day', now() AT TIME ZONE 'Asia/Jakarta') AT TIME ZONE 'Asia/Jakarta')::text AS transaction_count,
           (SELECT COUNT(*) FROM "CashierShift" cs WHERE cs."tenantId" = $1 AND cs.status = 'OPEN' AND cs."outletId" IN (SELECT id FROM outlets))::text AS open_shifts
         FROM "Sale" s
         WHERE s."tenantId" = $1 AND s.status = 'COMPLETED' AND s."outletId" IN (SELECT id FROM outlets)`,
        values,
      ),

      /* ── 2. Top products (existing) ────────────────────── */
      db.query<{ name: string; quantity: string; omzet: string }>(
        `${oCTE}
         SELECT si."productName" AS name, SUM(si.qty)::text AS quantity, SUM(si.subtotal)::text AS omzet
         FROM "SaleItem" si
         INNER JOIN "Sale" s ON s.id = si."saleId"
         WHERE s."tenantId" = $1 AND s.status = 'COMPLETED' AND s."outletId" IN (SELECT id FROM outlets)
           AND s."createdAt" >= date_trunc('day', now() AT TIME ZONE 'Asia/Jakarta') AT TIME ZONE 'Asia/Jakarta'
         GROUP BY si."productName"
         ORDER BY SUM(si.subtotal) DESC
         LIMIT 5`,
        values,
      ),

      /* ── 3. Low-stock alerts (existing) ────────────────── */
      db.query<{ id: string; name: string; qty: string; min_qty: string }>(
        `${oCTE}
         SELECT ps.id, p.name, ps.qty::text, COALESCE(rp."minQty", 5)::text AS min_qty
         FROM "ProductStock" ps
         INNER JOIN "Product" p ON p.id = ps."productId" AND p."tenantId" = $1
         LEFT JOIN "StockReorderPoint" rp ON rp."productId" = ps."productId" AND rp."outletId" = ps."outletId"
         WHERE ps."tenantId" = $1 AND ps."outletId" IN (SELECT id FROM outlets)
           AND p."isActive" = true AND p.kind = 'GOODS' AND ps.qty <= COALESCE(rp."minQty", 5)
         ORDER BY ps.qty ASC, p.name ASC
         LIMIT 5`,
        values,
      ),

      /* ── 4. Sales trend — last 7 days ──────────────────── */
      db.query<{ day: string; omzet: string; txn_count: string }>(
        `${oCTE}
         SELECT
           to_char(s."createdAt" AT TIME ZONE 'Asia/Jakarta', 'YYYY-MM-DD') AS day,
           COALESCE(SUM(s.total), 0)::text AS omzet,
           COUNT(s.id)::text AS txn_count
         FROM "Sale" s
         WHERE s."tenantId" = $1 AND s.status = 'COMPLETED' AND s."outletId" IN (SELECT id FROM outlets)
           AND s."createdAt" >= (date_trunc('day', now() AT TIME ZONE 'Asia/Jakarta') - interval '6 days') AT TIME ZONE 'Asia/Jakarta'
         GROUP BY day
         ORDER BY day ASC`,
        values,
      ),

      /* ── 5. Stock health summary ────────────────────────── */
      db.query<{ total: string; safe: string; low: string; out: string }>(
        `${oCTE}
         SELECT
           COUNT(*)::text AS total,
           COUNT(*) FILTER (WHERE ps.qty > COALESCE(rp."minQty", 5))::text AS safe,
           COUNT(*) FILTER (WHERE ps.qty > 0 AND ps.qty <= COALESCE(rp."minQty", 5))::text AS low,
           COUNT(*) FILTER (WHERE ps.qty <= 0)::text AS out
         FROM "ProductStock" ps
         INNER JOIN "Product" p ON p.id = ps."productId" AND p."tenantId" = $1
         LEFT JOIN "StockReorderPoint" rp ON rp."productId" = ps."productId" AND rp."outletId" = ps."outletId"
         WHERE ps."tenantId" = $1 AND ps."outletId" IN (SELECT id FROM outlets)
           AND p."isActive" = true AND p.kind = 'GOODS'`,
        values,
      ),

      /* ── 6. Payment breakdown (today) ──────────────────── */
      db.query<{ method: string; amount: string; count: string }>(
        `${oCTE}
         SELECT
           sp.method::text AS method,
           COALESCE(SUM(sp.amount), 0)::text AS amount,
           COUNT(*)::text AS count
         FROM "SalePayment" sp
         INNER JOIN "Sale" s ON s.id = sp."saleId"
         WHERE s."tenantId" = $1 AND s.status = 'COMPLETED' AND s."outletId" IN (SELECT id FROM outlets)
           AND s."createdAt" >= date_trunc('day', now() AT TIME ZONE 'Asia/Jakarta') AT TIME ZONE 'Asia/Jakarta'
         GROUP BY sp.method
         ORDER BY SUM(sp.amount) DESC`,
        values,
      ),

      /* ── 7. Cashier activity (open shifts) ─────────────── */
      db.query<{ shift_id: string; cashier_name: string; opened_at: string; last_sale_at: string | null; txn_count: string }>(
        `${oCTE}
         SELECT
           cs.id AS shift_id,
           u.name AS cashier_name,
           cs."openedAt"::text AS opened_at,
           (SELECT MAX(s2."createdAt")::text FROM "Sale" s2 WHERE s2."shiftId" = cs.id AND s2.status = 'COMPLETED') AS last_sale_at,
           (SELECT COUNT(*)::text FROM "Sale" s3 WHERE s3."shiftId" = cs.id AND s3.status = 'COMPLETED') AS txn_count
         FROM "CashierShift" cs
         INNER JOIN "User" u ON u.id = cs."userId"
         WHERE cs."tenantId" = $1 AND cs.status = 'OPEN' AND cs."outletId" IN (SELECT id FROM outlets)
         ORDER BY cs."openedAt" DESC`,
        values,
      ),
    ]);

  const summary = summaryResult.rows[0] ?? { today_sales: "0", yesterday_sales: "0", transaction_count: "0", open_shifts: "0" };
  const todaySales = Number(summary.today_sales);
  const transactionCount = Number(summary.transaction_count);

  return {
    todaySales,
    yesterdaySales: Number(summary.yesterday_sales),
    transactionCount,
    averageTransaction: transactionCount ? Math.round(todaySales / transactionCount) : 0,
    openShiftCount: Number(summary.open_shifts),
    alerts: alertResult.rows.map((item) => ({
      id: item.id,
      title: `${item.name} stok menipis`,
      body: `Sisa ${item.qty}; batas minimum ${item.min_qty}.`,
      href: "/produk",
    })),
    topProducts: topProductResult.rows.map((item) => ({
      name: item.name,
      quantity: Number(item.quantity),
      omzet: Number(item.omzet),
    })),
    /* ── Phase 1 additions ─────────────────────────────────── */
    salesTrend: trendResult.rows.map((r) => ({
      date: r.day,
      omzet: Number(r.omzet),
      transactions: Number(r.txn_count),
    })),
    stockHealth: (() => {
      const row = stockResult.rows[0];
      if (!row) return { total: 0, safe: 0, low: 0, out: 0 };
      return { total: Number(row.total), safe: Number(row.safe), low: Number(row.low), out: Number(row.out) };
    })(),
    paymentBreakdown: paymentResult.rows.map((r) => ({
      method: r.method,
      amount: Number(r.amount),
      count: Number(r.count),
    })),
    cashierActivity: cashierResult.rows.map((r) => ({
      shiftId: r.shift_id,
      cashierName: r.cashier_name,
      openedAt: r.opened_at,
      lastSaleAt: r.last_sale_at,
      transactionCount: Number(r.txn_count),
    })),
  };
}
