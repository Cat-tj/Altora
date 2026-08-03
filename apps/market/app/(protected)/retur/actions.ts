"use server";

import { revalidatePath } from "next/cache";
import { auth } from "../../../auth";
import { createReturn, findSaleForReturn, type ReturnableSale } from "../../../lib/market-returns";
import type { MarketRole } from "../../../lib/market-user";

type SessionUser = { id: string; tenantId: string; role: MarketRole };

async function requireUser() {
  const session = await auth();
  const user = session?.user as SessionUser | undefined;
  if (!user?.id || !user.role) throw new Error("Sesi berakhir. Masuk kembali.");
  return { tenantId: user.tenantId, userId: user.id, role: user.role };
}

export type LookupState = { error?: string; sale?: ReturnableSale };

export async function lookupSaleAction(_prev: LookupState, formData: FormData): Promise<LookupState> {
  try {
    const user = await requireUser();
    const invoice = String(formData.get("invoiceNumber") ?? "").trim();
    if (!invoice) return { error: "Masukkan nomor nota." };

    const sale = await findSaleForReturn(user, invoice);
    if (!sale) return { error: "Nota tidak ditemukan, sudah dibatalkan, atau di luar akses Anda." };
    if (sale.items.every((item) => item.qtyReturnable === 0)) {
      return { error: "Semua barang pada nota ini sudah diretur." };
    }
    return { sale };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Gagal mencari nota." };
  }
}

export type ReturnState = { error?: string; success?: string };

export async function createReturnAction(_prev: ReturnState, formData: FormData): Promise<ReturnState> {
  try {
    const user = await requireUser();

    const lines = [...formData.entries()]
      .filter(([key]) => key.startsWith("qty__"))
      .map(([key, value]) => {
        const saleItemId = key.slice("qty__".length);
        return {
          saleItemId,
          qty: Number(value) || 0,
          /* Tanpa centang berarti barang rusak: tercatat, tapi tidak kembali ke rak. */
          restock: formData.get(`restock__${saleItemId}`) === "on",
        };
      })
      .filter((line) => line.qty > 0);

    const result = await createReturn({
      ...user,
      saleId: String(formData.get("saleId") ?? ""),
      reason: String(formData.get("reason") ?? ""),
      lines,
    });

    revalidatePath("/retur");
    revalidatePath("/produk");
    return {
      success: `Retur ${result.returnNumber} tercatat. Refund Rp${result.refundAmount.toLocaleString("id-ID")}, ${result.restockCount} barang kembali ke stok.`,
    };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Gagal mencatat retur." };
  }
}
