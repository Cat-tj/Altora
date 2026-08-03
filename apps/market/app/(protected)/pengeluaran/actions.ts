"use server";

import { revalidatePath } from "next/cache";
import { auth } from "../../../auth";
import { createMarketExpense } from "../../../lib/market-expenses";

export async function addExpenseAction(_previousState: unknown, formData: FormData) {
  const session = await auth();
  const user = session?.user as { id?: string; tenantId?: string; role?: string } | undefined;
  if (!user?.id || !user?.tenantId) return { error: "Sesi tidak valid." };
  // Pengeluaran = catatan finansial; hanya pemilik/manajer.
  if (user.role === "STAFF") return { error: "Hanya pemilik atau manajer yang boleh mencatat pengeluaran." };

  const category = String(formData.get("category") ?? "OTHER").trim();
  const amount = Number(formData.get("amount") ?? 0);
  const description = String(formData.get("description") ?? "").trim();
  const outletId = String(formData.get("outletId") ?? "").trim();

  if (!amount || amount <= 0) return { error: "Nominal pengeluaran harus lebih besar dari 0." };
  if (!outletId) return { error: "Outlet wajib dipilih." };

  try {
    await createMarketExpense({
      tenantId: user.tenantId,
      outletId,
      category,
      amount,
      description,
      createdById: user.id,
    });
    revalidatePath("/pengeluaran");
    revalidatePath("/laporan");
    return { success: true };
  } catch (err: unknown) {
    return { error: (err as Error).message || "Gagal menyimpan pengeluaran." };
  }
}
