import Link from "next/link";
import type { MarketDashboardAlert } from "../../../../../lib/market-dashboard";

type Props = { alerts: MarketDashboardAlert[] };

export function DashboardStockAlerts({ alerts }: Props) {
  return (
    <div className="op-card">
      <div className="op-card-head">
        <div>
          <h2 className="op-card-title">Stok menipis</h2>
          <p className="op-card-sub">Produk di bawah batas minimum stok</p>
        </div>
        {alerts.length > 0 && (
          <Link href="/produk" className="op-card-link">Kelola stok</Link>
        )}
      </div>

      {alerts.length === 0 ? (
        <div className="op-empty-sm">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          <span>Semua stok dalam batas aman</span>
        </div>
      ) : (
        <div className="op-table-wrap">
          <table className="op-table">
            <thead>
              <tr>
                <th>Nama Produk</th>
                <th>Outlet</th>
                <th className="text-right">Stok</th>
                <th className="text-right">Min</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {alerts.map((alert) => (
                <tr key={alert.id}>
                  <td className="op-table-name">{alert.productName}</td>
                  <td className="op-table-outlet">{alert.outletName ?? "—"}</td>
                  <td className="text-right op-table-qty">
                    <span className={`op-qty-badge ${alert.qty === 0 ? "is-out" : "is-low"}`}>
                      {alert.qty}
                    </span>
                  </td>
                  <td className="text-right op-table-min">{alert.minQty}</td>
                  <td>
                    <Link href={alert.href} className="op-table-action">Restock</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
