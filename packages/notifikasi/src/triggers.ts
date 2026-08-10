import { createNotification } from "./resto-notifications.js";
import type { NotificationType, NotificationPriority } from "./resto-notifications.js";

// ── Helper: generate notifikasi otomatis ──────────────────

async function notify(data: {
  tenantId: string;
  type: NotificationType;
  priority?: NotificationPriority;
  title: string;
  message: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  try {
    await createNotification(data);
  } catch (err) {
    // Jangan crash aplikasi karena notifikasi gagal
    console.error("[notifikasi] Gagal membuat notifikasi:", err);
  }
}

// ── Triggers ───────────────────────────────────────────────

/**
 * Dipanggil saat stok bahan baku menipis.
 */
export async function onLowStock(
  tenantId: string,
  productName: string,
  currentQty: number,
  minQty: number,
): Promise<void> {
  await notify({
    tenantId,
    type: "LOW_STOCK",
    priority: "WARNING",
    title: "Stok Menipis",
    message: `${productName} tersisa ${currentQty} (minimum: ${minQty}). Segera lakukan pemesanan ulang.`,
    metadata: { productName, currentQty, minQty },
  });
}

/**
 * Dipanggil saat stok bahan baku habis.
 */
export async function onOutOfStock(
  tenantId: string,
  productName: string,
): Promise<void> {
  await notify({
    tenantId,
    type: "OUT_OF_STOCK",
    priority: "URGENT",
    title: "Stok Habis",
    message: `${productName} sudah habis. Tidak dapat memproses pesanan baru.`,
    metadata: { productName },
  });
}

/**
 * Dipanggil saat ada pesanan baru dari pelanggan.
 */
export async function onNewOrder(
  tenantId: string,
  orderNumber: string,
  tableNumber: string,
  total: number,
): Promise<void> {
  await notify({
    tenantId,
    type: "NEW_ORDER",
    priority: "INFO",
    title: "Pesanan Baru",
    message: `Pesanan ${orderNumber} dari ${tableNumber} — Rp${total.toLocaleString("id-ID")}`,
    metadata: { orderNumber, tableNumber, total },
  });
}

/**
 * Dipanggil saat pesanan siap disajikan.
 */
export async function onOrderReady(
  tenantId: string,
  orderNumber: string,
  tableNumber: string,
): Promise<void> {
  await notify({
    tenantId,
    type: "ORDER_READY",
    priority: "INFO",
    title: "Pesanan Siap",
    message: `Pesanan ${orderNumber} untuk ${tableNumber} siap disajikan.`,
    metadata: { orderNumber, tableNumber },
  });
}

/**
 * Dipanggil saat pesanan dibatalkan.
 */
export async function onOrderCancelled(
  tenantId: string,
  orderNumber: string,
  reason?: string,
): Promise<void> {
  await notify({
    tenantId,
    type: "ORDER_CANCELLED",
    priority: "WARNING",
    title: "Pesanan Dibatalkan",
    message: `Pesanan ${orderNumber} dibatalkan${reason ? `: ${reason}` : ""}.`,
    metadata: { orderNumber, reason },
  });
}

/**
 * Dipanggil saat meja ditugaskan untuk pesanan.
 */
export async function onTableAssigned(
  tenantId: string,
  tableNumber: string,
  orderNumber: string,
): Promise<void> {
  await notify({
    tenantId,
    type: "TABLE_ASSIGNED",
    priority: "INFO",
    title: "Meja Ditugaskan",
    message: `${tableNumber} ditugaskan untuk pesanan ${orderNumber}.`,
    metadata: { tableNumber, orderNumber },
  });
}

/**
 * Dipanggil saat pembayaran diterima.
 */
export async function onPaymentReceived(
  tenantId: string,
  orderNumber: string,
  tableNumber: string,
  amount: number,
  method: string,
): Promise<void> {
  await notify({
    tenantId,
    type: "PAYMENT_RECEIVED",
    priority: "INFO",
    title: "Pembayaran Diterima",
    message: `${tableNumber} — Rp${amount.toLocaleString("id-ID")} via ${method}`,
    metadata: { orderNumber, tableNumber, amount, method },
  });
}
