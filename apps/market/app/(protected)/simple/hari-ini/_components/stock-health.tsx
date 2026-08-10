import styles from "../dashboard.module.css";

type StockHealthData = { total: number; safe: number; low: number; out: number };

export function StockHealth({ data }: { data: StockHealthData }) {
  const total = data.total;

  if (total === 0) {
    return (
      <div className={styles.panel}>
        <div className={styles.panelHeading}>
          <div>
            <h2>Kondisi Stok</h2>
            <p>Distribusi stok retail</p>
          </div>
        </div>
        <div className={styles.empty}>
          <span className={styles.emptyIcon}>📦</span>
          <span className={styles.emptyTitle}>Belum ada data stok</span>
          <span className={styles.emptyDesc}>Tambahkan produk untuk melihat kondisi stok.</span>
        </div>
      </div>
    );
  }

  const safePct = total > 0 ? Math.round((data.safe / total) * 100) : 0;
  const lowPct = total > 0 ? Math.round((data.low / total) * 100) : 0;
  const outPct = total > 0 ? 100 - safePct - lowPct : 0;

  return (
    <div className={styles.panel}>
      <div className={styles.panelHeading}>
        <div>
          <h2>Kondisi Stok</h2>
          <p>Distribusi stok retail</p>
        </div>
      </div>

      {/* Visual bar */}
      <div className={styles.stockBar} role="img" aria-label={`Aman ${safePct}%, Rendah ${lowPct}%, Habis ${outPct}%`}>
        {data.safe > 0 && <div className={`${styles.stockBarSegment}`} style={{ width: `${safePct}%`, background: "var(--green)" }} />}
        {data.low > 0 && <div className={`${styles.stockBarSegment}`} style={{ width: `${lowPct}%`, background: "var(--amber)" }} />}
        {data.out > 0 && <div className={`${styles.stockBarSegment}`} style={{ width: `${outPct}%`, background: "var(--red)" }} />}
      </div>

      {/* Stats grid */}
      <div className={styles.stockGrid} style={{ marginTop: 16 }}>
        <div className={styles.stockStat}>
          <span className={`${styles.stockStatLabel} ${styles.stockSafe}`}>Aman</span>
          <strong className={`${styles.stockStatValue} ${styles.stockSafe}`}>{data.safe}</strong>
          <span className={styles.stockStatPct}>{safePct}% dari {total} produk</span>
        </div>
        <div className={styles.stockStat}>
          <span className={`${styles.stockStatLabel} ${styles.stockLow}`}>Rendah</span>
          <strong className={`${styles.stockStatValue} ${styles.stockLow}`}>{data.low}</strong>
          <span className={styles.stockStatPct}>{lowPct}% — perlu restock</span>
        </div>
        <div className={styles.stockStat}>
          <span className={`${styles.stockStatLabel} ${styles.stockOut}`}>Habis</span>
          <strong className={`${styles.stockStatValue} ${styles.stockOut}`}>{data.out}</strong>
          <span className={styles.stockStatPct}>{outPct}% — stok kosong</span>
        </div>
        <div className={styles.stockStat}>
          <span className={styles.stockStatLabel}>Total</span>
          <strong className={styles.stockStatValue}>{total}</strong>
          <span className={styles.stockStatPct}>Semua produk retail</span>
        </div>
      </div>
    </div>
  );
}
