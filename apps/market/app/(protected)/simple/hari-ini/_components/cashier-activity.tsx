import styles from "../dashboard.module.css";

type CashierShift = {
  shiftId: string;
  cashierName: string;
  openedAt: string;
  lastSaleAt: string | null;
  transactionCount: number;
};

function formatTime(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
}

function getInitials(name: string) {
  return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
}

export function CashierActivity({ shifts }: { shifts: CashierShift[] }) {
  return (
    <div className={styles.panel}>
      <div className={styles.panelHeading}>
        <div>
          <h2>Aktivitas Kasir</h2>
          <p>Shift aktif dan penjualan</p>
        </div>
      </div>
      {shifts.length ? (
        <div className={styles.cashierList}>
          {shifts.map((shift) => (
            <article key={shift.shiftId} className={styles.cashierItem}>
              <div className={styles.cashierAvatar}>{getInitials(shift.cashierName)}</div>
              <div className={styles.cashierInfo}>
                <span className={styles.cashierName}>{shift.cashierName}</span>
                <div className={styles.cashierStats}>
                  <span className={styles.cashierStat}>🕐 {formatTime(shift.openedAt)}</span>
                  <span className={styles.cashierStat}>🧾 {shift.transactionCount} transaksi</span>
                </div>
              </div>
              <span className={styles.cashierStatus}>Aktif</span>
            </article>
          ))}
        </div>
      ) : (
        <div className={styles.empty}>
          <span className={styles.emptyIcon}>🏪</span>
          <span className={styles.emptyTitle}>Tidak ada shift aktif</span>
          <span className={styles.emptyDesc}>Buka shift dari Kasir untuk memulai pencatatan penjualan.</span>
        </div>
      )}
    </div>
  );
}
