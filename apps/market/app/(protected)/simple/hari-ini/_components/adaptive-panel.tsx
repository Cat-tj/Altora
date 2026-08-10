import Link from "next/link";
import { formatRupiah } from "../../../market-page-ui";

type TopProduct = { name: string; quantity: number; omzet: number };

type Props = {
  hasSales: boolean;
  topProducts: TopProduct[];
};

function StartOpsPanel() {
  return (
    <div className="op-card op-start-card">
      <div className="op-card-head">
        <div>
          <h2 className="op-card-title">Mulai operasional</h2>
          <p className="op-card-sub">Belum ada penjualan hari ini</p>
        </div>
      </div>
      <div className="op-start-body">
        <div className="op-start-icon" aria-hidden="true">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>
        </div>
        <p className="op-start-text">Buka kasir untuk mulai mencatat transaksi. Produk terlaris akan muncul di sini setelah ada penjualan.</p>
        <Link href="/kasir" className="op-btn-primary op-start-cta">Buka Kasir Sekarang</Link>
      </div>
    </div>
  );
}

export function DashboardAdaptivePanel({ hasSales, topProducts }: Props) {
  if (!hasSales) return <StartOpsPanel />;

  return (
    <div className="op-card">
      <div className="op-card-head">
        <div>
          <h2 className="op-card-title">Produk terlaris</h2>
          <p className="op-card-sub">Berdasarkan omzet hari ini</p>
        </div>
      </div>
      {topProducts.length === 0 ? (
        <div className="op-empty-sm">
          <span>Belum ada data produk terlaris</span>
        </div>
      ) : (
        <ol className="op-top-list">
          {topProducts.map((product, index) => (
            <li key={product.name} className="op-top-item">
              <span className="op-top-rank">{index + 1}</span>
              <div className="op-top-info">
                <span className="op-top-name">{product.name}</span>
                <span className="op-top-meta">{product.quantity} item terjual</span>
              </div>
              <span className="op-top-omzet">{formatRupiah(product.omzet)}</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
