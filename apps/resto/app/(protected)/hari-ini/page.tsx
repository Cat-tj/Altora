import Link from "next/link";
import { auth } from "../../../auth";
import { getRestoDashboard } from "../../../lib/resto-dashboard";

export default async function RestoHomePage() {
  const session = await auth();
  const user = session!.user as { id: string; tenantId: string; role: "OWNER" | "MANAGER" | "STAFF" };
  const summary = await getRestoDashboard(user.tenantId);

  return (
    <div className="market-stack">
      <div className="market-page-title">
        <div>
          <p>Beranda Restoran</p>
          <h1>Operasional Hari Ini</h1>
          <span>Ringkasan meja dan pesanan aktif dari dapur Anda.</span>
        </div>
        <div className="market-primary-actions">
          <Link href="/meja">Kelola Meja</Link>
          <Link href="/pesanan">Pesanan Masuk</Link>
        </div>
      </div>

      <section className="market-stat-grid" aria-label="Ringkasan hari ini">
        <article className="market-stat-card is-primary">
          <span>Meja Terisi</span>
          <strong>{summary.occupiedTables} / {summary.totalTables}</strong>
          <small>Meja kosong: {summary.availableTables}</small>
        </article>
        <article className="market-stat-card">
          <span>Pesanan Dapur</span>
          <strong>{summary.preparingOrdersCount}</strong>
          <small>Sedang dikerjakan / pending</small>
        </article>
        <article className="market-stat-card">
          <span>Pesanan Selesai</span>
          <strong>{summary.completedOrdersToday}</strong>
          <small>Selesai disajikan hari ini</small>
        </article>
      </section>

      <div className="market-content-grid">
        <section className="market-panel">
          <div className="market-panel-heading">
            <div>
              <h2>Quick Actions</h2>
              <p>Navigasi cepat untuk staf lantai dan dapur.</p>
            </div>
          </div>
          <div className="market-alert-list" style={{ gridColumn: "span 2", display: "grid", gap: "1rem" }}>
            <Link href="/dapur" className="btn-white" style={{ padding: "1.25rem", borderRadius: "18px", border: "1px solid var(--line)", display: "block", textAlign: "center", fontWeight: "700" }}>
              Buka Layar Dapur (KDS)
            </Link>
            <Link href="/meja" className="btn-white" style={{ padding: "1.25rem", borderRadius: "18px", border: "1px solid var(--line)", display: "block", textAlign: "center", fontWeight: "700" }}>
              Peta Meja & Dine-in
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
