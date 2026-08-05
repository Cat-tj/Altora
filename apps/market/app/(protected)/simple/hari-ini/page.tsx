import Link from "next/link";
import { auth } from "../../../../auth";
import { getMarketDashboard } from "../../../../lib/market-dashboard";
import { EmptyMarketState, formatRupiah } from "../../market-page-ui";

export default async function MarketHomePage() {
  const session = await auth();
  const user = session!.user as { id: string; tenantId: string; role: "OWNER" | "MANAGER" | "STAFF" };
  const summary = await getMarketDashboard({ tenantId: user.tenantId, userId: user.id, role: user.role });
  return (
    <div className="market-stack">
      {/* KPI Row */}
      <section className="market-stat-grid" aria-label="Ringkasan hari ini">
        <article className="market-kpi-glass market-kpi-hero">
          <span>Omzet hari ini</span>
          <strong>{formatRupiah(summary.todaySales)}</strong>
          <small>Kemarin {formatRupiah(summary.yesterdaySales)}</small>
        </article>
        <article className="market-kpi-glass">
          <span>Transaksi</span>
          <strong>{summary.transactionCount}</strong>
          <small>Penjualan selesai hari ini</small>
        </article>
        <article className="market-kpi-glass">
          <span>Rata-rata belanja</span>
          <strong>{formatRupiah(summary.averageTransaction)}</strong>
          <small>Berdasarkan transaksi selesai</small>
        </article>
        <article className="market-kpi-glass">
          <span>Shift aktif</span>
          <strong>{summary.openShiftCount}</strong>
          <small>{summary.openShiftCount ? "Kasir sedang berjalan" : "Belum ada shift dibuka"}</small>
        </article>
      </section>

      {/* Content Grid */}
      <div className="market-content-grid">
        {/* Action Items */}
        <section className="market-panel">
          <div className="market-panel-heading">
            <div>
              <h2>Perlu ditindak</h2>
              <p>Stok retail yang berada di bawah batas minimum.</p>
            </div>
            <Link href="/produk">Buka produk</Link>
          </div>
          {summary.alerts.length ? (
            <div className="market-alert-list">
              {summary.alerts.map((alert) => (
                <article key={alert.id}>
                  <span className="market-alert-dot is-warning" aria-hidden="true" />
                  <div>
                    <strong>{alert.title}</strong>
                    <p>{alert.body}</p>
                  </div>
                  <Link href={alert.href}>Buka</Link>
                </article>
              ))}
            </div>
          ) : (
            <EmptyMarketState title="Tidak ada stok kritis" description="Produk dengan stok rendah akan muncul di sini." />
          )}
        </section>

        {/* Top Products */}
        <section className="market-panel">
          <div className="market-panel-heading">
            <div>
              <h2>Produk terlaris</h2>
              <p>Penjualan selesai hari ini.</p>
            </div>
          </div>
          {summary.topProducts.length ? (
            <ol className="market-top-products">
              {summary.topProducts.map((product, index) => (
                <li key={product.name}>
                  <b>{index + 1}</b>
                  <span>
                    <strong>{product.name}</strong>
                    <small>{product.quantity} item terjual</small>
                  </span>
                  <em>{formatRupiah(product.omzet)}</em>
                </li>
              ))}
            </ol>
          ) : (
            <EmptyMarketState title="Belum ada penjualan hari ini" description="Mulai dari Kasir agar ringkasan terisi." action={{ href: "/kasir", label: "Buka Kasir" }} />
          )}
        </section>
      </div>
    </div>
  );
}
