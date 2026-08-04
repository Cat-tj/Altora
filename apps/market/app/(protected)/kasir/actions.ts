"use server";

import { revalidatePath } from "next/cache";
import { auth } from "../../../auth";
import { closeMarketShift, createMarketSale, openMarketShift, voidMarketSale } from "../../../lib/market-pos";

type User = { id: string; tenantId: string; role: "OWNER" | "MANAGER" | "STAFF" };
function currentUser() {
  return auth().then((session) => session?.user as User | undefined);
}

export async function openMarketShiftAction(formData: FormData): Promise<{ error?: string; success?: true }> {
  const user = await currentUser();
  if (!user) return { error: "Sesi berakhir. Masuk kembali." };
  const outletId = String(formData.get("outletId") ?? "");
  const rawOpeningCash = String(formData.get("openingCash") ?? "").trim();
  const openingCash = Number(rawOpeningCash);
  if (!outletId || !rawOpeningCash || !Number.isSafeInteger(openingCash) || openingCash < 0) return { error: "Outlet dan modal awal wajib diisi dengan nominal yang valid." };
  try {
    await openMarketShift({ ...user, userId: user.id, outletId, openingCash });
    revalidatePath("/kasir");
    return { success: true };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Shift gagal dibuka." };
  }
}

export async function createMarketSaleAction(payload: {
  shiftId: string;
  requestId: string;
  items: { productId: string; quantity: number; variantOptionIds?: string[]; discountAmount?: number }[];
  paymentMethod?: "CASH" | "QRIS" | "TRANSFER" | "EWALLET" | "DEPOSIT" | "GIFT_CARD";
  amountPaid?: number;
  payments?: { method: "CASH" | "QRIS" | "TRANSFER" | "EWALLET" | "DEPOSIT" | "GIFT_CARD"; amount: number }[];
  memberId?: string;
  cartDiscount?: number;
}): Promise<{ error?: string; sale?: { id: string; invoiceNumber: string; total: number; change: number } }> {
  const user = await currentUser();
  if (!user) return { error: "Sesi berakhir. Masuk kembali." };
  try {
    const sale = await createMarketSale({ tenantId: user.tenantId, userId: user.id, ...payload });
    revalidatePath("/kasir");
    revalidatePath("/simple/hari-ini");
    return { sale: { id: sale.id, invoiceNumber: sale.invoiceNumber, total: sale.total, change: sale.change } };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Transaksi gagal disimpan." };
  }
}

export async function voidMarketSaleAction(saleId: string, reason: string): Promise<{ error?: string; success?: true }> {
  const user = await currentUser();
  if (!user) return { error: "Sesi berakhir. Masuk kembali." };
  try {
    await voidMarketSale({ tenantId: user.tenantId, userId: user.id, role: user.role, saleId, reason });
    revalidatePath("/kasir"); revalidatePath("/kasir/riwayat"); revalidatePath(`/kasir/struk/${saleId}`); revalidatePath("/simple/hari-ini");
    return { success: true };
  } catch (error) { return { error: error instanceof Error ? error.message : "Transaksi gagal dibatalkan." }; }
}

export async function closeMarketShiftAction(formData: FormData): Promise<{ error?: string; expectedCash?: number }> {
  const user = await currentUser();
  if (!user) return { error: "Sesi berakhir. Masuk kembali." };
  const shiftId = String(formData.get("shiftId") ?? ""); const closingCash = Number(String(formData.get("closingCash") ?? "")); const varianceNote = String(formData.get("varianceNote") ?? "");
  try {
    const result = await closeMarketShift({ tenantId: user.tenantId, userId: user.id, shiftId, closingCash, varianceNote });
    revalidatePath("/kasir"); revalidatePath("/simple/hari-ini");
    return result;
  } catch (error) { return { error: error instanceof Error ? error.message : "Shift gagal ditutup." }; }
}
