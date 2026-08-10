"use server";

import { revalidatePath } from "next/cache";
import { auth } from "../../auth";
import { db } from "../db";

export type RestoOrderStatus = "PENDING" | "ACCEPTED" | "READY" | "COMPLETED" | "CANCELLED";
export type RestoPaymentMethod = "CASH" | "QRIS" | "TRANSFER" | "EWALLET";
export type ActionResult = { success?: boolean; error?: string };

async function tenantUser() {
  const session = await auth();
  const user = session?.user as { id?: string; tenantId?: string; role?: string } | undefined;
  if (!user?.id || !user.tenantId) throw new Error("Sesi tidak valid.");
  return user;
}

export async function updateOrderStatusAction(id: string, status: RestoOrderStatus): Promise<ActionResult> {
  const user = await tenantUser();
  try {
    const result = await db.query(
      `UPDATE "TableOrder" SET status = $1::"TableOrderStatus", "updatedAt" = NOW()
       WHERE id = $2 AND "tenantId" = $3 AND status NOT IN ('COMPLETED', 'CANCELLED')`,
      [status, id, user.tenantId],
    );
    if (result.rowCount !== 1) return { error: "Pesanan tidak ditemukan atau sudah selesai." };
    revalidatePath("/pesanan"); revalidatePath("/dapur"); revalidatePath("/hari-ini");
    return { success: true };
  } catch (error) { return { error: error instanceof Error ? error.message : "Gagal memperbarui pesanan." }; }
}

export async function completeOrderPaymentAction(id: string, method: RestoPaymentMethod, amountPaid: number): Promise<ActionResult> {
  const user = await tenantUser();
  try {
    await db.query("BEGIN");
    const order = await db.query<{ total: number }>(
      `SELECT total FROM "TableOrder" WHERE id = $1 AND "tenantId" = $2 AND status NOT IN ('COMPLETED','CANCELLED') FOR UPDATE`, [id, user.tenantId]);
    if (!order.rows[0]) throw new Error("Pesanan tidak ditemukan atau sudah selesai.");
    if (method === "CASH" && amountPaid < Number(order.rows[0].total)) throw new Error("Uang diterima kurang dari total tagihan.");
    await db.query(`UPDATE "TableOrder" SET status = 'COMPLETED', "updatedAt" = NOW() WHERE id = $1 AND "tenantId" = $2`, [id, user.tenantId]);
    await db.query("COMMIT");
    revalidatePath("/pesanan"); revalidatePath("/pembayaran"); revalidatePath("/laporan");
    return { success: true };
  } catch (error) { await db.query("ROLLBACK").catch(() => undefined); return { error: error instanceof Error ? error.message : "Gagal memproses pembayaran." }; }
}

export async function createTableAction(outletId: string, name: string, posX: number, posY: number, floor: number, shape: string, capacity: number): Promise<ActionResult> {
  const user = await tenantUser();
  try {
    await db.query(`INSERT INTO "Table" (id, "tenantId", "outletId", name, "qrToken", "posX", "posY", floor, shape, capacity) VALUES (gen_random_uuid()::text,$1,$2,$3,encode(gen_random_bytes(12),'hex'),$4,$5,$6,$7,$8)`, [user.tenantId, outletId, name, posX, posY, floor, shape, capacity]);
    revalidatePath("/meja"); return { success: true };
  } catch (error) { return { error: error instanceof Error ? error.message : "Gagal membuat meja." }; }
}

export async function updateTableAction(id: string, name: string, posX: number, posY: number, floor: number, shape: string, capacity: number): Promise<ActionResult> {
  const user = await tenantUser();
  try { const result = await db.query(`UPDATE "Table" SET name=$1,"posX"=$2,"posY"=$3,floor=$4,shape=$5,capacity=$6,"updatedAt"=NOW() WHERE id=$7 AND "tenantId"=$8`, [name,posX,posY,floor,shape,capacity,id,user.tenantId]); if (!result.rowCount) return { error: "Meja tidak ditemukan." }; revalidatePath("/meja"); return { success: true }; }
  catch (error) { return { error: error instanceof Error ? error.message : "Gagal menyimpan meja." }; }
}

export async function toggleTableActiveAction(id: string, isActive: boolean): Promise<ActionResult> {
  const user = await tenantUser();
  try { const result = await db.query(`UPDATE "Table" SET "isActive"=$1,"updatedAt"=NOW() WHERE id=$2 AND "tenantId"=$3`, [isActive,id,user.tenantId]); if (!result.rowCount) return { error: "Meja tidak ditemukan." }; revalidatePath("/meja"); return { success: true }; }
  catch (error) { return { error: error instanceof Error ? error.message : "Gagal mengubah status meja." }; }
}

export async function getLowStockItems() { return []; }
