import { formatRupiah } from "../../../market-page-ui";
import styles from "../dashboard.module.css";

type TopProduct = { name: string; quantity: number; omzet: number };

export function TopProducts({ products }: { products: TopProduct[] }) {
  return (
    <div className={styles.panel}>
      <div className={styles.panelHeading}>
        <div>
          <h2>Produk terlaris</h2>
          <p>Penjualan selesai hari ini.</p>
        </div>
      </div>
      {products.length ? (
        <ol className={styles.topList}>
          {products.map((product, index) => (
            <li key={product.name} className={styles.topItem}>
              <span className={styles.topRank}>{index + 1}</span>
              <div className={styles.topInfo}>
                <span className={styles.topName}>{product.name}</span>
                <span className={styles.topMeta}>{product.quantity} item terjual</span>
              </div>
              <span className={styles.topOmzet}>{formatRupiah(product.omzet)}</span>
            </li>
          ))}
        </ol>
      ) : (
        <div className={styles.empty}>
          <span className={styles.emptyIcon}>🛒</span>
          <span className={styles.emptyTitle}>Belum ada penjualan hari ini</span>
          <span className={styles.emptyDesc}>Mulai dari Kasir agar ringkasan terisi.</span>
        </div>
      )}
    </div>
  );
}
