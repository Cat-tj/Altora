"use server";

import { revalidatePath } from "next/cache";
import { auth } from "../../../auth";
import { applyStockCount, cancelStockCount, createStockCount } from "../../../lib/market-stock-count";
import type { MarketRole } from "../../../lib/market-user";

type SessionUser = { id: string; tenantId: string; role: MarketRole };

async function requireStockManager() {
  const session = await auth();
  const user = session?.user as SessionUser | undefined;
  if (!user?.id || !user.role) throw new Error("Sesi berakhir. Masuk kembali.");
  /* Opname mengoreksi stok, jadi kasir tidak diberi akses. */
  if (user.role === "STAFF") throw new Error("Hanya pemilik atau manajer yang boleh melakukan stock opname.");
  return { tenantId: user.tenantId, userId: user.id, role: user.role };
}

export type CountState = { error?: string; success?: string };

export async function createCountAction(_prev: CountState, formData: FormData): Promise<CountState> {
  try {
    const user = await requireStockManager();

    /* Hanya baris yang benar-benar diisi yang ikut. Produk yang dilewati
       berarti tidak dihitung, bukan dihitung nol — itu beda besar. */
    const lines = [...formData.entries()]
      .filter(([key, value]) => key.startsWith("count__") && String(value).trim() !== "")
      .map(([key, value]) => ({
        productId: key.slice("count__".length),
        countedQty: Number(value) || 0,
      }));

    const result = await createStockCount({
      ...user,
      outletId: String(formData.get("outletId") ?? ""),
      notes: (formData.get("notes") as string) || null,
      lines,
    });

    revalidatePath("/opname");
    return {
      success: `Opname ${result.countNumber} disimpan sebagai draft. ${result.differences} produk berbeda dari catatan sistem.`,
    };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Gagal menyimpan opname." };
  }
}

export async function applyCountAction(_prev: CountState, formData: FormData): Promise<CountState> {
  try {
    const user = await requireStockManager();
    const result = await applyStockCount({ ...user, countId: String(formData.get("countId") ?? "") });
    revalidatePath("/opname");
    revalidatePath("/produk");
    return { success: `Opname ${result.countNumber} diterapkan. ${result.adjusted} produk dikoreksi.` };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Gagal menerapkan opname." };
  }
}

export async function cancelCountAction(_prev: CountState, formData: FormData): Promise<CountState> {
  try {
    const user = await requireStockManager();
    await cancelStockCount({ tenantId: user.tenantId, countId: String(formData.get("countId") ?? "") });
    revalidatePath("/opname");
    return { success: "Opname draft dibatalkan." };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Gagal membatalkan opname." };
  }
}
