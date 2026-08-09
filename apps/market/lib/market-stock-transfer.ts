import { db } from "./db";
import { applyStockMovement, InsufficientStockError } from "./market-stock-ledger";

export type StockTransferRecord = {
  id: string;
  tenantId: string;
  fromOutletName: string;
  toOutletName: string;
  productName: string;
  qty: number;
  status: string;
  createdByName: string;
  createdAt: string;
};

export async function listStockTransfers(tenantId: string): Promise<StockTransferRecord[]> {
  const result = await db.query<{
    id: string;
    tenant_id: string;
    from_outlet_name: string;
    to_outlet_name: string;
    product_name: string;
    qty: number;
    status: string;
    created_by_name: string;
    created_at: Date;
  }>(
    `SELECT st.id,
            st."tenantId" AS tenant_id,
            o1.name AS from_outlet_name,
            o2.name AS to_outlet_name,
            p.name AS product_name,
            st.qty,
            st.status,
            u.name AS created_by_name,
            st."createdAt" AS created_at
       FROM "StockTransfer" st
       JOIN "Outlet" o1 ON o1.id = st."fromOutletId"
       JOIN "Outlet" o2 ON o2.id = st."toOutletId"
       JOIN "Product" p ON p.id = st."productId"
       JOIN "User" u ON u.id = st."createdById"
      WHERE st."tenantId" = $1
      ORDER BY st."createdAt" DESC`,
    [tenantId]
  );

  return result.rows.map((row) => ({
    id: row.id,
    tenantId: row.tenant_id,
    fromOutletName: row.from_outlet_name,
    toOutletName: row.to_outlet_name,
    productName: row.product_name,
    qty: row.qty,
    status: row.status,
    createdByName: row.created_by_name,
    createdAt: row.created_at.toISOString(),
  }));
}

/**
 * Pindahkan stok antar cabang: outlet asal -qty (TRANSFER_OUT), tujuan +qty
 * (TRANSFER_IN), keduanya tercatat di StockLedger dengan idempotencyKey
 * `transfer:<transferId>:<productId>` agar retry tidak menggandakan.
 *
 * Sebelumnya fungsi ini hanya mencatat baris StockTransfer tanpa mengubah
 * stok — stok transfer hilang dari saldo. Sekarang satu transaksi atomik:
 * kunci saldo asal (FOR UPDATE), cek kecukupan, pindahkan, catat ledger,
 * tandai transfer COMPLETED.
 */
export async function createStockTransfer(data: {
  tenantId: string;
  fromOutletId: string;
  toOutletId: string;
  productId: string;
  qty: number;
  createdById: string;
  /** Kunci idempotensi dari sisi klien — kirim ulang requestId yang sama saat retry. */
  requestId?: string;
}): Promise<void> {
  if (data.fromOutletId === data.toOutletId) {
    throw new Error("Cabang asal dan tujuan tidak boleh sama.");
  }
  if (!Number.isSafeInteger(data.qty) || data.qty <= 0) {
    throw new Error("Jumlah transfer harus bilangan bulat lebih dari nol.");
  }

  const id = `TRF-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  const idempotencyKey = data.requestId ? `transfer:${data.requestId}` : `transfer:${id}`;
  const client = await db.connect();
  try {
    await client.query("BEGIN");

    const inserted = await client.query(
      `INSERT INTO "StockTransfer" (id, "tenantId", "fromOutletId", "toOutletId", "productId", qty, status, "createdById", "idempotencyKey")
       VALUES ($1, $2, $3, $4, $5, $6, 'PENDING', $7, $8)
       ON CONFLICT ("idempotencyKey") DO NOTHING
       RETURNING id, status`,
      [id, data.tenantId, data.fromOutletId, data.toOutletId, data.productId, data.qty, data.createdById, idempotencyKey]
    );
    if (inserted.rowCount === 0) {
      /* Retry request yang sama: transfer sudah pernah diproses. */
      await client.query("ROLLBACK");
      return;
    }

    const out = await applyStockMovement(client, {
      tenantId: data.tenantId,
      outletId: data.fromOutletId,
      productId: data.productId,
      delta: -data.qty,
      source: "TRANSFER_OUT",
      sourceId: id,
      actorId: data.createdById,
      note: "Transfer keluar",
      idempotencyKey: `transfer:${id}:${data.productId}:out`,
    });
    if (!out) {
      /* Secara teori tak mungkin: idempotencyKey transfer baru. Jaga-jaga. */
      await client.query("ROLLBACK");
      return;
    }

    await applyStockMovement(client, {
      tenantId: data.tenantId,
      outletId: data.toOutletId,
      productId: data.productId,
      delta: data.qty,
      source: "TRANSFER_IN",
      sourceId: id,
      actorId: data.createdById,
      note: "Transfer masuk",
      idempotencyKey: `transfer:${id}:${data.productId}:in`,
    });

    await client.query(
      `UPDATE "StockTransfer" SET status = 'COMPLETED', "appliedAt" = NOW() WHERE id = $1`,
      [id]
    );

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    if (error instanceof InsufficientStockError) {
      throw new Error("Stok di cabang asal tidak mencukupi untuk transfer.");
    }
    throw error;
  } finally {
    client.release();
  }
}
