import { randomUUID } from "node:crypto";
import type { PoolClient } from "pg";

/**
 * Satu-satunya jalan mengubah stok Market.
 *
 * Saldo hidup di "ProductStock".qty supaya kasir tidak perlu menjumlah ledger
 * setiap membaca stok, tetapi setiap perubahan saldo wajib meninggalkan satu
 * baris "StockLedger" di transaksi yang sama. Kalau nanti saldo terlihat
 * janggal, ledger yang menjelaskan asalnya.
 *
 * Semua fungsi di sini menerima `PoolClient`, bukan pool: pemanggilnya yang
 * memiliki transaksi, sehingga perubahan stok tidak pernah commit terpisah
 * dari peristiwa yang menyebabkannya.
 */

export type StockLedgerSource = "OPENING" | "SALE" | "SALE_VOID" | "RETURN" | "RECEIPT" | "ADJUSTMENT";

export type StockMovement = {
  tenantId: string;
  outletId: string;
  productId: string;
  /** Negatif untuk barang keluar. */
  delta: number;
  source: StockLedgerSource;
  sourceId?: string | null;
  actorId?: string | null;
  note?: string | null;
  /**
   * Menahan penulisan ganda saat aksi yang sama dikirim ulang. Susun dari
   * peristiwanya, mis. `sale:<saleId>:<productId>`, bukan dari nilai acak.
   */
  idempotencyKey: string;
};

export class InsufficientStockError extends Error {
  constructor(readonly productId: string) {
    super("Stok tidak mencukupi.");
    this.name = "InsufficientStockError";
  }
}

/**
 * Terapkan satu perubahan stok beserta catatan ledgernya.
 *
 * Mengembalikan `false` bila kunci idempotensinya sudah pernah dipakai —
 * artinya perubahan itu sudah diterapkan sebelumnya dan tidak boleh diulang.
 */
export async function applyStockMovement(client: PoolClient, movement: StockMovement): Promise<boolean> {
  const { tenantId, outletId, productId, delta } = movement;

  /* Kunci baris saldo lebih dulu supaya dua transaksi pada produk yang sama
     tidak saling menimpa hasilnya. */
  const locked = await client.query<{ qty: string }>(
    `SELECT qty FROM "ProductStock"
      WHERE "tenantId" = $1 AND "outletId" = $2 AND "productId" = $3
      FOR UPDATE`,
    [tenantId, outletId, productId],
  );

  if (locked.rowCount === 0) {
    /* Produk belum punya saldo di outlet ini. Untuk barang masuk itu wajar —
       buat barisnya. Untuk barang keluar berarti memang tidak ada stoknya. */
    if (delta < 0) throw new InsufficientStockError(productId);

    await client.query(
      `INSERT INTO "ProductStock" (id, "tenantId", "productId", "outletId", qty)
       VALUES ($1, $2, $3, $4, 0)
       ON CONFLICT ("productId", "outletId") DO NOTHING`,
      [`ps_${randomUUID().replaceAll("-", "").slice(0, 20)}`, tenantId, productId, outletId],
    );
  }

  const updated = await client.query<{ qty: number }>(
    `UPDATE "ProductStock"
        SET qty = qty + $1, "updatedAt" = NOW()
      WHERE "tenantId" = $2 AND "outletId" = $3 AND "productId" = $4
        AND qty + $1 >= 0
      RETURNING qty`,
    [delta, tenantId, outletId, productId],
  );

  /* Syarat `qty + delta >= 0` di UPDATE membuat stok tidak pernah minus,
     ditegakkan database dan bukan hanya dicek sebelum menulis. */
  if (updated.rowCount === 0) throw new InsufficientStockError(productId);

  const inserted = await client.query(
    `INSERT INTO "StockLedger"
       (id, "tenantId", "outletId", "productId", delta, "balanceAfter", source, "sourceId", "actorId", note, "idempotencyKey")
     VALUES ($1, $2, $3, $4, $5, $6, $7::"StockLedgerSource", $8, $9, $10, $11)
     ON CONFLICT ("idempotencyKey") DO NOTHING`,
    [
      `led_${randomUUID().replaceAll("-", "").slice(0, 20)}`,
      tenantId,
      outletId,
      productId,
      delta,
      updated.rows[0]!.qty,
      movement.source,
      movement.sourceId ?? null,
      movement.actorId ?? null,
      movement.note ?? null,
      movement.idempotencyKey,
    ],
  );

  /* Kunci sudah terpakai: saldo barusan terlanjur berubah dua kali, jadi
     kembalikan. Pemanggil yang benar memakai kunci stabil sehingga jalur ini
     hanya tersentuh saat request betul-betul diulang. */
  if (inserted.rowCount === 0) {
    await client.query(
      `UPDATE "ProductStock" SET qty = qty - $1
        WHERE "tenantId" = $2 AND "outletId" = $3 AND "productId" = $4`,
      [delta, tenantId, outletId, productId],
    );
    return false;
  }

  return true;
}

export type LedgerEntry = {
  id: string;
  productName: string;
  delta: number;
  balanceAfter: number;
  source: StockLedgerSource;
  note: string | null;
  actorName: string | null;
  createdAt: string;
};

/** Riwayat pergerakan stok satu outlet, terbaru dulu. */
export async function getStockLedger(
  client: PoolClient,
  input: { tenantId: string; outletId: string; productId?: string; limit?: number },
): Promise<LedgerEntry[]> {
  const { rows } = await client.query(
    `SELECT l.id, p.name AS "productName", l.delta, l."balanceAfter",
            l.source, l.note, u.name AS "actorName", l."createdAt"
       FROM "StockLedger" l
       INNER JOIN "Product" p ON p.id = l."productId"
       LEFT JOIN "User" u ON u.id = l."actorId"
      WHERE l."tenantId" = $1 AND l."outletId" = $2
        AND ($3::text IS NULL OR l."productId" = $3)
      ORDER BY l."createdAt" DESC, l.id DESC
      LIMIT $4`,
    [input.tenantId, input.outletId, input.productId ?? null, input.limit ?? 100],
  );
  return rows as LedgerEntry[];
}
