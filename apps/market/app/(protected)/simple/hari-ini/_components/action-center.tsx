import Link from "next/link";
import styles from "../dashboard.module.css";

type Alert = { id: string; title: string; body: string; href: string };

export function ActionCenter({ alerts }: { alerts: Alert[] }) {
  return (
    <div className={styles.panel}>
      <div className={styles.panelHeading}>
        <div>
          <h2>Perlu ditindak</h2>
          <p>Stok dan operasional yang memerlukan perhatian.</p>
        </div>
        <Link href="/produk" className={styles.panelLink}>Buka produk</Link>
      </div>
      {alerts.length ? (
        <div className={styles.alertList}>
          {alerts.map((alert) => (
            <article key={alert.id} className={styles.alertItem}>
              <span className={`${styles.alertDot} ${styles.alertDotWarning}`} aria-hidden="true" />
              <div className={styles.alertContent}>
                <span className={styles.alertTitle}>{alert.title}</span>
                <p className={styles.alertBody}>{alert.body}</p>
              </div>
              <Link href={alert.href} className={styles.alertAction}>Buka</Link>
            </article>
          ))}
        </div>
      ) : (
        <div className={styles.empty}>
          <span className={styles.emptyIcon}>✅</span>
          <span className={styles.emptyTitle}>Tidak ada stok kritis</span>
          <span className={styles.emptyDesc}>Produk dengan stok rendah akan muncul di sini.</span>
        </div>
      )}
    </div>
  );
}
