import Link from "next/link";
import { auth } from "../../../../auth";
import { getMarketDashboard } from "../../../../lib/market-dashboard";
import { EmptyMarketState, formatRupiah } from "../../market-page-ui";
import { SalesTrendChart } from "./sales-trend-chart";

export default async function MarketHomePage() {
  const session = await auth();
  const user = session!.user as { id: string; tenantId: string; role: "OWNER" | "MANAGER" | "STAFF" };
  const summary = await getMarketDashboard({ tenantId: user.tenantId, userId: user.id, role: user.role });

  const changePercent =
    summary.yesterdaySales > 0
      ? Math.round(((summary.todaySales - summary.yesterdaySales) / summary.yesterdaySales) * 100)
      : null;

  return (
    <div className="market-stack">
      {/* Top Header */}
      <div className="market-page-title">
        <div>
          <p>Beranda toko</p>
          <h1>Operasional hari ini</h1>
          <span>Ringkasan transaksi, grafik tren sales, dan kontrol stok retail.</span>
        </div>
        <div className="market-primary-actions">
          <Link href="/kasir">Buka Kasir</Link>
          <Link href="/produk">Lihat Produk</Link>
        </div>
      </div>

      {/* 4 Stat KPI Cards */}
      <section className="market-stat-grid" aria-label="Ringkasan hari ini">
        <article className="market-stat-card is-primary">
          <div className="market-stat-header">
            <span>Omzet hari ini</span>
            {changePercent !== null && (
              <span className={`market-stat-badge ${changePercent >= 0 ? "is-up" : "is-down"}`}>
                {changePercent >= 0 ? `↑ +${changePercent}%` : `↓ ${changePercent}%`}
              </span>
            )}
          </div>
          <strong>{formatRupiah(summary.todaySales)}</strong>
          <small>Kemarin {formatRupiah(summary.yesterdaySales)}</small>
        </article>

        <article className="market-stat-card">
          <div className="market-stat-header">
            <span>Transaksi</span>
          </div>
          <strong>{summary.transactionCount}</strong>
          <small>Penjualan selesai hari ini</small>
        </article>

        <article className="market-stat-card">
          <div className="market-stat-header">
            <span>Rata-rata belanja</span>
          </div>
          <strong>{formatRupiah(summary.averageTransaction)}</strong>
          <small>Berdasarkan transaksi selesai</small>
        </article>

        <article className="market-stat-card">
          <div className="market-stat-header">
            <span>Shift aktif</span>
          </div>
          <strong>{summary.openShiftCount}</strong>
          <small>{summary.openShiftCount ? "Kasir sedang berjalan" : "Belum ada shift dibuka"}</small>
        </article>
      </section>

      {/* Sales Trend Line Chart */}
      <SalesTrendChart data={summary.salesTrend} />

      {/* 2-Column Content Tables: Perlu Ditindak & Produk Terlaris */}
      <div className="market-content-grid">
        {/* Table 1: Perlu Ditindak */}
        <section className="market-panel">
          <div className="market-panel-heading">
            <div>
              <h2>Perlu ditindak</h2>
              <p>Stok retail yang berada di bawah batas minimum.</p>
            </div>
            <Link href="/produk">Buka Produk</Link>
          </div>

          {summary.alerts.length ? (
            <div className="market-table-scroll">
              <table className="market-dashboard-table">
                <thead>
                  <tr>
                    <th>Status</th>
                    <th>Nama Produk</th>
                    <th className="text-right">Stok</th>
                    <th className="text-right">Batas Min</th>
                    <th className="text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.alerts.map((alert) => (
                    <tr key={alert.id}>
                      <td>
                        <span className="market-pill is-warning">Stok Menipis</span>
                      </td>
                      <td>
                        <strong>{alert.productName}</strong>
                      </td>
                      <td className="text-right text-amber">
                        <strong>{alert.qty} unit</strong>
                      </td>
                      <td className="text-right">{alert.minQty} unit</td>
                      <td className="text-center">
                        <Link className="market-table-action" href={alert.href}>
                          Buka
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyMarketState
              title="Tidak ada stok kritis"
              description="Semua produk retail Anda berada di atas batas minimum."
            />
          )}
        </section>

        {/* Table 2: Produk Terlaris */}
        <section className="market-panel">
          <div className="market-panel-heading">
            <div>
              <h2>Produk terlaris</h2>
              <p>Penjualan selesai hari ini.</p>
            </div>
          </div>

          {summary.topProducts.length ? (
            <div className="market-table-scroll">
              <table className="market-dashboard-table">
                <thead>
                  <tr>
                    <th style={{ width: "50px" }}>No</th>
                    <th>Nama Produk</th>
                    <th className="text-right">Terjual</th>
                    <th className="text-right">Total Omzet</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.topProducts.map((product, index) => (
                    <tr key={product.name}>
                      <td className="text-center">
                        <span className="market-rank-badge">{index + 1}</span>
                      </td>
                      <td>
                        <strong>{product.name}</strong>
                      </td>
                      <td className="text-right">
                        <span>{product.quantity} item</span>
                      </td>
                      <td className="text-right text-accent">
                        <strong>{formatRupiah(product.omzet)}</strong>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyMarketState
              title="Belum ada penjualan hari ini"
              description="Mulai dari Kasir agar ringkasan terisi."
              action={{ href: "/kasir", label: "Buka Kasir" }}
            />
          )}
        </section>
      </div>
    </div>
  );
}
