import { auth } from "../../../auth";
import { redirect } from "next/navigation";
import {
  getDailySummary,
  getSalesByPeriod,
  getProfitMargin,
  getBestSellers,
} from "@altora/laporan/resto-reports";

export const dynamic = "force-dynamic";

export default async function LaporanPage() {
  const session = await auth();
  const user = session?.user as
    | { id: string; tenantId: string; role: "OWNER" | "MANAGER" | "STAFF" }
    | undefined;

  if (!user?.tenantId) redirect("/login");

  const [summary, salesByPeriod, profitMargin, bestSellers] = await Promise.all([
    getDailySummary(user.tenantId),
    getSalesByPeriod(user.tenantId, 7),
    getProfitMargin(user.tenantId),
    getBestSellers(user.tenantId, 30, 10),
  ]);

  const fmtRp = (n: number) => `Rp${n.toLocaleString("id-ID")}`;

  return (
    <div className="market-stack">
      <div className="market-page-title">
        <div>
          <p>Laporan & Analytics</p>
          <h1>Dashboard Penjualan</h1>
          <span>Ringkasan penjualan, margin keuntungan, dan menu terlaris.</span>
        </div>
      </div>

      {/* Ringkasan Hari Ini */}
      <section className="market-stat-grid" aria-label="Ringkasan hari ini">
        <article className="market-stat-card is-primary">
          <span>Total Pendapatan</span>
          <strong>{fmtRp(summary.totalRevenue)}</strong>
          <small>{summary.totalOrders} pesanan selesai</small>
        </article>
        <article className="market-stat-card">
          <span>Rata-rata per Pesanan</span>
          <strong>{fmtRp(summary.avgOrderValue)}</strong>
          <small>Average order value</small>
        </article>
        <article className="market-stat-card">
          <span>Pengeluaran</span>
          <strong>{fmtRp(summary.totalExpenses)}</strong>
          <small>Biaya operasional hari ini</small>
        </article>
        <article className="market-stat-card">
          <span>Profit Bersih</span>
          <strong style={{ color: summary.netProfit >= 0 ? "var(--green)" : "var(--red)" }}>
            {fmtRp(summary.netProfit)}
          </strong>
          <small>Pendapatan - Pengeluaran</small>
        </article>
      </section>

      <div className="market-content-grid" style={{ gridTemplateColumns: "1fr 1fr" }}>
        {/* Margin Keuntungan */}
        <section className="market-panel">
          <div className="market-panel-heading">
            <h2>Margin Keuntungan</h2>
          </div>
          <div style={{ display: "grid", gap: "1rem", marginTop: "1rem" }}>
            <div style={{ display: "flex", justifyContent: "between" }}>
              <span>Total Revenue</span>
              <span className="num">{fmtRp(profitMargin.totalRevenue)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "between" }}>
              <span>Total Biaya Bahan</span>
              <span className="num">{fmtRp(profitMargin.totalCost)}</span>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "between",
                fontWeight: "800",
                borderTop: "1px solid var(--line)",
                paddingTop: "1rem",
              }}
            >
              <span>Gross Profit</span>
              <span className="num" style={{ color: profitMargin.grossProfit >= 0 ? "var(--green)" : "var(--red)" }}>
                {fmtRp(profitMargin.grossProfit)} ({profitMargin.grossMarginPercent}%)
              </span>
            </div>
          </div>
        </section>

        {/* Menu Terlaris */}
        <section className="market-panel">
          <div className="market-panel-heading">
            <h2>Top 10 Menu Terlaris</h2>
            <span style={{ fontSize: "0.8rem", color: "var(--muted)" }}>30 hari terakhir</span>
          </div>
          <div style={{ marginTop: "1rem" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid var(--line)" }}>
                  <th style={{ padding: "0.5rem 0.75rem", color: "var(--muted)" }}>#</th>
                  <th style={{ padding: "0.5rem 0.75rem", color: "var(--muted)" }}>Menu</th>
                  <th style={{ padding: "0.5rem 0.75rem", color: "var(--muted)", textAlign: "right" }}>Qty</th>
                  <th style={{ padding: "0.5rem 0.75rem", color: "var(--muted)", textAlign: "right" }}>Revenue</th>
                </tr>
              </thead>
              <tbody>
                {bestSellers.map((item, i) => (
                  <tr key={item.productId} style={{ borderBottom: "1px solid var(--line-2)" }}>
                    <td style={{ padding: "0.75rem", fontWeight: "700" }}>{i + 1}</td>
                    <td style={{ padding: "0.75rem", fontWeight: "700" }}>{item.productName}</td>
                    <td style={{ padding: "0.75rem", textAlign: "right" }}>{item.totalQty}</td>
                    <td style={{ padding: "0.75rem", textAlign: "right" }} className="num">{fmtRp(item.totalRevenue)}</td>
                  </tr>
                ))}
                {bestSellers.length === 0 && (
                  <tr>
                    <td colSpan={4} style={{ padding: "2rem", textAlign: "center", color: "var(--muted)" }}>
                      Belum ada data penjualan.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {/* Penjualan 7 Hari Terakhir */}
      <section className="market-panel">
        <div className="market-panel-heading">
          <h2>Penjualan 7 Hari Terakhir</h2>
        </div>
        <div style={{ display: "grid", gap: "0.5rem", marginTop: "1rem" }}>
          {salesByPeriod.map((period) => (
            <div
              key={period.period}
              style={{
                display: "flex",
                justifyContent: "between",
                padding: "0.75rem 1rem",
                borderRadius: "12px",
                backgroundColor: "var(--surface-2)",
              }}
            >
              <span style={{ fontWeight: "600" }}>{period.period}</span>
              <span style={{ display: "flex", gap: "2rem", color: "var(--muted)" }}>
                <span>{period.orderCount} pesanan</span>
                <span className="num" style={{ fontWeight: "700", color: "var(--ink)" }}>
                  {fmtRp(period.totalSales)}
                </span>
              </span>
            </div>
          ))}
          {salesByPeriod.length === 0 && (
            <p style={{ padding: "2rem", textAlign: "center", color: "var(--muted)" }}>
              Belum ada data penjualan 7 hari terakhir.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
