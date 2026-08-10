import Link from "next/link";
import type { MarketDashboardAlert } from "../../../../../lib/market-dashboard";

type Props = {
  alerts: MarketDashboardAlert[];
  openShifts: number;
};

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function WarnIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

function ShiftIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
    </svg>
  );
}

function SyncIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 4 23 10 17 10" />
      <polyline points="1 20 1 14 7 14" />
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
    </svg>
  );
}

export function DashboardActionCenter({ alerts, openShifts }: Props) {
  const shiftIssue = openShifts === 0;
  const stockIssue = alerts.length > 0;
  const hasIssues = shiftIssue || stockIssue;

  return (
    <div className="op-card op-action-card">
      <div className="op-card-head">
        <div>
          <h2 className="op-card-title">Perlu perhatian</h2>
          <p className="op-card-sub">Tindakan yang disarankan hari ini</p>
        </div>
        {hasIssues && (
          <span className="op-badge-count">{(shiftIssue ? 1 : 0) + (stockIssue ? 1 : 0)}</span>
        )}
      </div>

      <div className="op-action-list">
        {/* Shift issue */}
        {shiftIssue && (
          <div className="op-action-item op-action-item--warn">
            <div className="op-action-dot op-action-dot--warn">
              <ShiftIcon />
            </div>
            <div className="op-action-content">
              <span className="op-action-title">Shift belum dibuka</span>
              <p className="op-action-body">Kasir belum aktif hari ini. Buka shift untuk mulai mencatat penjualan.</p>
            </div>
            <Link href="/kasir" className="op-action-btn">Buka shift</Link>
          </div>
        )}

        {/* Stock issues */}
        {stockIssue && (
          <div className="op-action-item op-action-item--warn">
            <div className="op-action-dot op-action-dot--warn">
              <WarnIcon />
            </div>
            <div className="op-action-content">
              <span className="op-action-title">{alerts.length} produk stok menipis</span>
              <p className="op-action-body">Segera restock agar penjualan tidak terhambat.</p>
            </div>
            <Link href="/produk" className="op-action-btn">Lihat produk</Link>
          </div>
        )}

        {/* All good — sync status */}
        {!hasIssues && (
          <div className="op-action-item op-action-item--ok">
            <div className="op-action-dot op-action-dot--ok">
              <CheckIcon />
            </div>
            <div className="op-action-content">
              <span className="op-action-title">Toko beroperasi normal</span>
              <p className="op-action-body">Shift aktif, stok aman, tidak ada masalah operasional saat ini.</p>
            </div>
          </div>
        )}

        {/* Data sync */}
        <div className="op-action-item op-action-item--neutral">
          <div className="op-action-dot op-action-dot--neutral">
            <SyncIcon />
          </div>
          <div className="op-action-content">
            <span className="op-action-title">Data tersinkron</span>
            <p className="op-action-body">Semua perubahan tersimpan dan terkini.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
