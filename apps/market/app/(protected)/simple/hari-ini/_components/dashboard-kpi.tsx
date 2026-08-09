import { formatRupiah } from "../../../market-page-ui";
import styles from "../dashboard.module.css";

type KpiData = {
  todaySales: number;
  yesterdaySales: number;
  transactionCount: number;
  averageTransaction: number;
  openShiftCount: number;
};

function TrendBadge({ current, previous }: { current: number; previous: number }) {
  if (previous === 0) return null;
  const pct = Math.round(((current - previous) / previous) * 100);
  if (pct > 0) return <span className={`${styles.kpiTrend} ${styles.kpiTrendUp}`}>↑ {pct}%</span>;
  if (pct < 0) return <span className={`${styles.kpiTrend} ${styles.kpiTrendDown}`}>↓ {Math.abs(pct)}%</span>;
  return <span className={`${styles.kpiTrend} ${styles.kpiTrendNeutral}`}>→ 0%</span>;
}

export function DashboardKpi({ data }: { data: KpiData }) {
  return (
    <section className={styles.kpiGrid} aria-label="Ringkasan hari ini">
      {/* Hero: Omzet */}
      <article className={`${styles.kpiCard} ${styles.kpiHero}`}>
        <span className={styles.kpiLabel}>Omzet hari ini</span>
        <strong className={styles.kpiValue}>{formatRupiah(data.todaySales)}</strong>
        <small className={styles.kpiSub}>
          Kemarin {formatRupiah(data.yesterdaySales)}
          <TrendBadge current={data.todaySales} previous={data.yesterdaySales} />
        </small>
      </article>

      {/* Transaksi */}
      <article className={styles.kpiCard}>
        <span className={styles.kpiLabel}>Transaksi</span>
        <strong className={styles.kpiValue}>{data.transactionCount}</strong>
        <small className={styles.kpiSub}>Penjualan selesai hari ini</small>
      </article>

      {/* Rata-rata Belanja */}
      <article className={styles.kpiCard}>
        <span className={styles.kpiLabel}>Rata-rata belanja</span>
        <strong className={styles.kpiValue}>{formatRupiah(data.averageTransaction)}</strong>
        <small className={styles.kpiSub}>Berdasarkan transaksi selesai</small>
      </article>

      {/* Shift Aktif */}
      <article className={styles.kpiCard}>
        <span className={styles.kpiLabel}>Shift aktif</span>
        <strong className={styles.kpiValue}>{data.openShiftCount}</strong>
        <small className={styles.kpiSub}>
          {data.openShiftCount ? "Kasir sedang berjalan" : "Belum ada shift dibuka"}
        </small>
      </article>
    </section>
  );
}
