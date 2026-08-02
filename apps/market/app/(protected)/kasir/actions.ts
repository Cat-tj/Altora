"use server";

import { revalidatePath } from "next/cache";
import { auth } from "../../../auth";
import { createMarketSale, openMarketShift } from "../../../lib/market-pos";

type User = { id: string; tenantId: string; role: "OWNER" | "MANAGER" | "STAFF" };
function currentUser() {
  return auth().then((session) => session?.user as User | undefined);
}

export async function openMarketShiftAction(formData: FormData): Promise<{ error?: string; success?: true }> {
  const user = await currentUser();
  if (!user) return { error: "Sesi berakhir. Masuk kembali." };
  const outletId = String(formData.get("outletId") ?? "");
  const openingCash = Number(formData.get("openingCash") ?? 0);
  try {
    await openMarketShift({ ...user, userId: user.id, outletId, openingCash });
    revalidatePath("/kasir");
    return { success: true };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Shift gagal dibuka." };
  }
}

export async function createMarketSaleAction(payload: { shiftId: string; items: { productId: string; quantity: number }[]; paymentMethod: "CASH" | "QRIS" | "TRANSFER" | "EWALLET"; amountPaid: number }): Promise<{ error?: string; sale?: { invoiceNumber: string; total: number; change: number } }> {
  const user = await currentUser();
  if (!user) return { error: "Sesi berakhir. Masuk kembali." };
  try {
    const sale = await createMarketSale({ tenantId: user.tenantId, userId: user.id, ...payload });
    revalidatePath("/kasir");
    revalidatePath("/simple/hari-ini");
    return { sale: { invoiceNumber: sale.invoiceNumber, total: sale.total, change: sale.change } };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Transaksi gagal disimpan." };
  }
}
