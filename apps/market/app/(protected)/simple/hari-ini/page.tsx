import Link from "next/link";
import { auth } from "../../../../auth";
import { getMarketDashboard } from "../../../../lib/market-dashboard";
import { formatRupiah } from "../../market-page-ui";
import { SalesTrendChart } from "./sales-trend-chart";
import { DashboardActionCenter } from "./_components/action-center-v2";
import { DashboardStockAlerts } from "./_components/stock-alerts-v2";
import { DashboardAdaptivePanel } from "./_components/adaptive-panel";
import { DashboardSyncStatus } from "./_components/sync-status";

export default async function MarketHomePage() {
  const session = await auth();
  const user = session!.user as { id: string; tenantId: string; role: "OWNER" | "MANAGER" | "STAFF" };
  const summary = await getMarketDashboard({ tenantId: user.tenantId, userId: user.id, role: user.role });

  const changePercent =
    summary.yesterdaySales > 0
      ? Math.round(((summary.todaySales - summary.yesterdaySales) / summary.yesterdaySales) * 100)
      : null;

  const avgTx = summary.transactionCount > 0
    ? Math.round(summary.todaySales / summary.transactionCount)
    : 0;

  const hasSales = summary.transactionCount > 0;

  return (
    <div className="op-page">
      {/* ── Page Header ────────────────────────────────── */}
      <header className="op-header">
        <div className="op-header-text">
          <p className="op-breadcrumb">Beranda toko</p>
          <h1 className="op-title">Operasional hari ini</h1>
          <span className="op-subtitle">Pantau penjualan, stok, dan operasional toko.</span>
        </div>
        <div className="op-header-actions">
          <DashboardSyncStatus />
          <Link href="/kasir" className="op-btn-primary">Buka Kasir</Link>
          <Link href="/produk" className="op-btn-ghost">Lihat Produk</Link>
        </div>
      </header>

      {/* ── KPI Row ────────────────────────────────────── */}
      <section className="op-kpi-grid" aria-label="Ringkasan hari ini">
        {/* Omzet */}
        <article className="op-kpi-card">
          <div className="op-kpi-top">
            <span className="op-kpi-label">Omzet hari ini</span>
            <span className="op-kpi-icon op-kpi-icon--revenue" aria-hidden="true">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
            </span>
          </div>
          <strong className="op-kpi-value">{formatRupiah(summary.todaySales)}</strong>
          <div className="op-kpi-meta">
            <span>Kemarin {formatRupiah(summary.yesterdaySales)}</span>
            {changePercent !== null && (
              <span className={`op-kpi-badge ${changePercent >= 0 ? "is-up" : "is-down"}`}>
                {changePercent >= 0 ? `↑ +${changePercent}%` : `↓ ${changePercent}%`}
              </span>
            )}
          </div>
        </article>

        {/* Transaksi */}
        <article className="op-kpi-card">
          <div className="op-kpi-top">
            <span className="op-kpi-label">Transaksi</span>
            <span className="op-kpi-icon op-kpi-icon--txn" aria-hidden="true">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
            </span>
          </div>
          <strong className="op-kpi-value">{summary.transactionCount}</strong>
          <span className="op-kpi-meta">Penjualan selesai hari ini</span>
        </article>

        {/* Rata-rata Belanja */}
        <article className="op-kpi-card">
          <div className="op-kpi-top">
            <span className="op-kpi-label">Rata-rata belanja</span>
            <span className="op-kpi-icon op-kpi-icon--avg" aria-hidden="true">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            </span>
          </div>
          <strong className="op-kpi-value">{formatRupiah(avgTx)}</strong>
          <span className="op-kpi-meta">Per transaksi selesai</span>
        </article>

        {/* Shift Aktif */}
        <article className={`op-kpi-card${summary.openShiftCount === 0 ? " op-kpi-card--alert" : ""}`}>
          <div className="op-kpi-top">
            <span className="op-kpi-label">Shift aktif</span>
            <span className={`op-kpi-icon ${summary.openShiftCount > 0 ? "op-kpi-icon--shift-on" : "op-kpi-icon--shift-off"}`} aria-hidden="true">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            </span>
          </div>
          <strong className="op-kpi-value">{summary.openShiftCount}</strong>
          <span className="op-kpi-meta">
            {summary.openShiftCount > 0 ? "Kasir sedang berjalan" : "Belum ada shift dibuka"}
          </span>
        </article>
      </section>

      {/* ── Main Grid: Chart (8col) + Action Center (4col) ─ */}
      <div className="op-main-grid">
        <div className="op-chart-area">
          <SalesTrendChart data={summary.salesTrend} />
        </div>
        <div className="op-action-area">
          <DashboardActionCenter
            alerts={summary.alerts}
            openShifts={summary.openShiftCount}
          />
        </div>
      </div>

      {/* ── Secondary Grid: Stock + Adaptive Panel ────── */}
      <div className="op-secondary-grid">
        <div className="op-stock-area">
          <DashboardStockAlerts alerts={summary.alerts} />
        </div>
        <div className="op-adaptive-area">
          <DashboardAdaptivePanel
            hasSales={hasSales}
            topProducts={summary.topProducts}
          />
        </div>
      </div>
    </div>
  );
}
