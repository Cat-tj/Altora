import { NextResponse } from "next/server";
import { auth } from "../../auth";
import { createMarketExpense } from "../../lib/market-expenses";

export async function POST(request: Request) {
  const session = await auth();
  const user = session?.user as { id?: string; tenantId?: string; role?: string } | undefined;
  if (!user?.id || !user?.tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role === "STAFF") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json();
  const { outletId, category, amount, description } = body ?? {};
  if (!outletId || !amount || amount <= 0) return NextResponse.json({ error: "outletId dan amount wajib diisi." }, { status: 400 });

  try {
    await createMarketExpense({
      tenantId: user.tenantId,
      outletId,
      category: category ?? "OTHER",
      amount,
      description: description ?? "",
      createdById: user.id,
    });
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    return NextResponse.json({ error: (err as Error).message || "Gagal menyimpan." }, { status: 500 });
  }
}
