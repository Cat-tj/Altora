"use server";

import { revalidatePath } from "next/cache";
import { auth } from "../../../auth";
import { cancelReceipt, completeReceipt, createReceipt } from "../../../lib/market-receiving";
import type { MarketRole } from "../../../lib/market-user";

type SessionUser = { id: string; tenantId: string; role: MarketRole };

async function requireUser(): Promise<SessionUser> {
  const session = await auth();
  const user = session?.user as SessionUser | undefined;
  if (!user?.id || !user.role) throw new Error("Sesi berakhir. Masuk kembali.");
  return user;
}

/* Penerimaan mengubah stok, jadi kasir tidak diberi akses. */
function requireStockManager(user: SessionUser) {
  if (user.role === "STAFF") throw new Error("Hanya pemilik atau manajer yang boleh mencatat penerimaan barang.");
}

export type FormState = { error?: string; success?: string };

export async function createReceiptAction(_prev: FormState, formData: FormData): Promise<FormState> {
  try {
    const user = await requireUser();
    requireStockManager(user);

    /* Baris dikirim sebagai qty__<productId>, jadi jumlah barisnya tidak perlu
       ikut dikirim dan form tetap benar walau produk difilter di klien. */
    const items = [...formData.entries()]
      .filter(([key]) => key.startsWith("qty__"))
      .map(([key, value]) => ({
        productId: key.slice("qty__".length),
        qtyAccepted: Number(value) || 0,
        qtyDefect: Number(formData.get(`defect__${key.slice("qty__".length)}`)) || 0,
        unitCost: Number(formData.get(`cost__${key.slice("qty__".length)}`)) || 0,
      }))
      .filter((item) => item.qtyAccepted > 0 || item.qtyDefect > 0);

    const receipt = await createReceipt({
      tenantId: user.tenantId,
      userId: user.id,
      role: user.role,
      outletId: String(formData.get("outletId") ?? ""),
      supplierId: (formData.get("supplierId") as string) || null,
      shippingCost: Number(formData.get("shippingCost")) || 0,
      otherCost: Number(formData.get("otherCost")) || 0,
      notes: (formData.get("notes") as string) || null,
      items,
    });

    revalidatePath("/penerimaan");
    return { success: `Nota ${receipt.receiptNumber} dibuat sebagai draft. Periksa lalu selesaikan untuk menambah stok.` };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Gagal membuat nota penerimaan." };
  }
}

export async function completeReceiptAction(_prev: FormState, formData: FormData): Promise<FormState> {
  try {
    const user = await requireUser();
    requireStockManager(user);
    const result = await completeReceipt({
      tenantId: user.tenantId,
      userId: user.id,
      role: user.role,
      receiptId: String(formData.get("receiptId") ?? ""),
    });
    revalidatePath("/penerimaan");
    revalidatePath("/produk");
    return { success: `Nota ${result.receiptNumber} selesai. Stok ${result.lines} produk bertambah.` };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Gagal menyelesaikan nota." };
  }
}

export async function cancelReceiptAction(_prev: FormState, formData: FormData): Promise<FormState> {
  try {
    const user = await requireUser();
    requireStockManager(user);
    await cancelReceipt({
      tenantId: user.tenantId,
      userId: user.id,
      role: user.role,
      receiptId: String(formData.get("receiptId") ?? ""),
    });
    revalidatePath("/penerimaan");
    return { success: "Nota draft dibatalkan." };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Gagal membatalkan nota." };
  }
}
