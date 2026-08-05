"use client";

import { formatRupiah } from "../../../market-page-ui";
import styles from "../dashboard.module.css";

type TrendData = { date: string; omzet: number; transactions: number }[];

function formatDate(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("id-ID", { weekday: "short", day: "numeric" });
}

function formatDayLabel(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
}

export function SalesTrend({ data }: { data: TrendData }) {
  if (!data.length) {
    return (
      <div className={`${styles.panel} ${styles.fullWidth}`}>
        <div className={styles.panelHeading}>
          <div>
            <h2>Tren Penjualan</h2>
            <p>7 hari terakhir</p>
          </div>
        </div>
        <div className={styles.empty}>
          <span className={styles.emptyIcon}>📊</span>
          <span className={styles.emptyTitle}>Belum ada data tren</span>
          <span className={styles.emptyDesc}>Data penjualan 7 hari akan muncul di sini setelah ada transaksi.</span>
        </div>
      </div>
    );
  }

  const maxOmzet = Math.max(...data.map((d) => d.omzet), 1);
  const maxTxn = Math.max(...data.map((d) => d.transactions), 1);

  // Fill missing days
  const today = new Date();
  const days: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().slice(0, 10));
  }

  const dataMap = new Map(data.map((d) => [d.date, d]));
  const filled = days.map((day) => dataMap.get(day) ?? { date: day, omzet: 0, transactions: 0 });

  // Y-axis labels (4 ticks)
  const yTicks = [0, 1, 2, 3].map((i) => Math.round(maxOmzet * (1 - i / 3)));

  return (
    <div className={`${styles.panel} ${styles.fullWidth}`}>
      <div className={styles.panelHeading}>
        <div>
          <h2>Tren Penjualan</h2>
          <p>7 hari terakhir</p>
        </div>
      </div>

      <div className={styles.chartContainer}>
        <div className={styles.chartYAxis} aria-hidden="true">
          {yTicks.map((v, i) => (
            <span key={i}>{formatRupiah(v)}</span>
          ))}
        </div>

        <div className={styles.chartArea}>
          <div className={styles.chartBars}>
            {filled.map((d) => (
              <div
                key={d.date}
                className={styles.chartBar}
                style={{ height: `${Math.max((d.omzet / maxOmzet) * 100, 2)}%` }}
              >
                <div className={styles.chartBarTooltip}>
                  {formatDate(d.date)}: {formatRupiah(d.omzet)}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.chartLabels}>
          {filled.map((d) => (
            <span key={d.date} className={styles.chartLabel}>
              {formatDayLabel(d.date)}
            </span>
          ))}
        </div>
      </div>

      {/* Accessibility: textual summary */}
      <div className={styles.chartLegend}>
        <span className={styles.chartLegendItem}>
          <span className={styles.chartLegendDot} />
          Total omzet 7 hari: {formatRupiah(filled.reduce((s, d) => s + d.omzet, 0))}
        </span>
        <span className={styles.chartLegendItem}>
          Total transaksi: {filled.reduce((s, d) => s + d.transactions, 0)}
        </span>
      </div>
    </div>
  );
}
