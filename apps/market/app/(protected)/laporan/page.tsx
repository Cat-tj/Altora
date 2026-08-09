import { requireRole } from "../../../lib/market-authz";
import { getMarketReportSummary } from "../../../lib/market-reports";
import { formatRupiah } from "../market-page-ui";

export default async function LaporanPage() {
  const user = await requireRole(["OWNER", "MANAGER"]);
  const summary = await getMarketReportSummary(user.tenantId);

  return (
    <div className="market-stack">
      <div className="market-page-title">
        <div>
          <p>Laporan & Keuangan</p>
          <h1>Laporan Penjualan & Laba Rugi</h1>
          <span>Pantau omzet kotor, retur barang, pengeluaran operasional, dan laba bersih.</span>
        </div>
      </div>

      <section className="market-stat-grid" aria-label="Ringkasan keuangan">
        <article className="market-stat-card">
          <span>Penjualan Kotor (Gross)</span>
          <strong>{formatRupiah(summary.grossSales)}</strong>
          <small>{summary.transactionCount} transaksi selesai</small>
        </article>

        <article className="market-stat-card">
          <span>Retur Penjualan</span>
          <strong style={{ color: "var(--red)" }}>-{formatRupiah(summary.totalReturns)}</strong>
          <small>Pengembalian barang & dana</small>
        </article>

        <article className="market-stat-card">
          <span>Penjualan Bersih (Net)</span>
          <strong>{formatRupiah(summary.netSales)}</strong>
          <small>Omzet setelah dipotong retur</small>
        </article>

        <article className="market-stat-card">
          <span>Total Pengeluaran</span>
          <strong style={{ color: "var(--amber)" }}>-{formatRupiah(summary.totalExpenses)}</strong>
          <small>Biaya operasional outlet</small>
        </article>
      </section>

      <section className="market-panel">
        <div className="market-panel-heading">
          <h2>Estimasi Laba Bersih (Net Profit)</h2>
        </div>
        <div style={{ marginTop: "1rem", padding: "1.5rem", borderRadius: "26px", backgroundColor: summary.netProfit >= 0 ? "var(--green-soft)" : "var(--red-soft)", border: `2px solid ${summary.netProfit >= 0 ? "var(--green)" : "var(--red)"}` }}>
          <span style={{ fontSize: "0.9rem", color: "var(--muted)", fontWeight: "600" }}>Laba Bersih Akhir</span>
          <h2 style={{ fontSize: "2.25rem", margin: "0.5rem 0 0", color: summary.netProfit >= 0 ? "var(--green)" : "var(--red)", fontFamily: "var(--font-mono)" }}>
            {formatRupiah(summary.netProfit)}
          </h2>
          <p style={{ margin: "0.5rem 0 0", fontSize: "0.85rem", color: "var(--muted)" }}>
            Dihitung dari (Penjualan Bersih - Total Pengeluaran Operasional).
          </p>
        </div>
      </section>
    </div>
  );
}
