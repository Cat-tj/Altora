import styles from "../dashboard.module.css";

type PaymentData = { method: string; count: number; amount: number }[];

const METHOD_CONFIG: Record<string, { label: string; icon: string; iconClass: string }> = {
  CASH: { label: "Tunai", icon: "💵", iconClass: "paymentIconCash" },
  QRIS: { label: "QRIS", icon: "📱", iconClass: "paymentIconQris" },
  TRANSFER: { label: "Transfer", icon: "🏦", iconClass: "paymentIconTransfer" },
  EWALLET: { label: "E-Wallet", icon: "💳", iconClass: "paymentIconOther" },
  DEPOSIT: { label: "Deposit", icon: "💰", iconClass: "paymentIconOther" },
  GIFT_CARD: { label: "Gift Card", icon: "🎁", iconClass: "paymentIconOther" },
};

function formatRp(n: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);
}

export function PaymentBreakdown({ data }: { data: PaymentData }) {
  const totalAmount = data.reduce((s, d) => s + d.amount, 0);

  if (!data.length) {
    return (
      <div className={styles.panel}>
        <div className={styles.panelHeading}>
          <div>
            <h2>Metode Pembayaran</h2>
            <p>Breakdown transaksi hari ini</p>
          </div>
        </div>
        <div className={styles.empty}>
          <span className={styles.emptyIcon}>💳</span>
          <span className={styles.emptyTitle}>Belum ada pembayaran</span>
          <span className={styles.emptyDesc}>Data metode pembayaran akan muncul setelah ada transaksi.</span>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.panel}>
      <div className={styles.panelHeading}>
        <div>
          <h2>Metode Pembayaran</h2>
          <p>Breakdown transaksi hari ini</p>
        </div>
      </div>
      <div className={styles.paymentList}>
        {data.map((item) => {
          const cfg = METHOD_CONFIG[item.method] ?? { label: item.method, icon: "❓", iconClass: "paymentIconOther" };
          const pct = totalAmount > 0 ? Math.round((item.amount / totalAmount) * 100) : 0;
          return (
            <div key={item.method} className={styles.paymentItem}>
              <span className={`${styles.paymentIcon} ${styles[cfg.iconClass]}`}>{cfg.icon}</span>
              <div className={styles.paymentInfo}>
                <div className={styles.paymentMethod}>{cfg.label}</div>
                <div className={styles.paymentCount}>{item.count} transaksi</div>
                <div className={styles.paymentBar}>
                  <div className={styles.paymentBarFill} style={{ width: `${pct}%` }} />
                </div>
              </div>
              <span className={styles.paymentAmount}>{formatRp(item.amount)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
