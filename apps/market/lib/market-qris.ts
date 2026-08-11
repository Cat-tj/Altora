import { convertQRIS } from "./qris/converter";
import { validateQRIS } from "./qris/validator";
import { db } from "./db";

/**
 * QRIS dinamis untuk Altora Market.
 *
 * - `staticQrisPayload` disimpan di TenantSetting (diisi dari bank/aggregator).
 * - Saat kasir memilih QRIS, payload statis dikonversi jadi dinamis dengan
 *   nominal transaksi (tag 54), POI 11→12, CRC16 dihitung ulang.
 * - Client merender payload dinamis sebagai QR code; kasir konfirmasi manual
 *   setelah dana masuk.
 */
export async function buildDynamicQris(tenantId: string, amount: number): Promise<{ payload: string; merchantName: string }> {
  const row = await db.query<{ payload: string | null }>(
    `SELECT "staticQrisPayload" AS payload FROM "TenantSetting" WHERE "tenantId" = $1 LIMIT 1`,
    [tenantId],
  );
  const staticPayload = row.rows[0]?.payload;
  if (!staticPayload) {
    throw new Error("QRIS toko belum diatur. Isi payload QRIS statis di Pengaturan Toko.");
  }
  const validation = validateQRIS(staticPayload);
  if (!validation.valid) {
    throw new Error("Payload QRIS statis tidak valid. Periksa kembali di Pengaturan Toko.");
  }
  if (!Number.isSafeInteger(amount) || amount <= 0) {
    throw new Error("Nominal QRIS tidak valid.");
  }
  const dynamic = convertQRIS(staticPayload, { amount });
  const merchantName = (staticPayload.match(/^.*?59(\d{2})(.*?)60\d{2}/)?.[2] ?? "Toko").trim();
  return { payload: dynamic, merchantName };
}

/** Payload statis disimpan apa adanya — validasi ringan sebelum disimpan. */
export function normalizeStaticQris(payload: string): string {
  const trimmed = payload.trim();
  if (!trimmed) throw new Error("Payload QRIS tidak boleh kosong.");
  if (!/^[0-9A-F]+$/i.test(trimmed)) throw new Error("Payload QRIS hanya boleh berisi hex (0-9 A-F).");
  const v = validateQRIS(trimmed);
  if (!v.valid) throw new Error(`Payload QRIS tidak valid: ${v.errors.join(", ")}`);
  return trimmed.toUpperCase();
}
