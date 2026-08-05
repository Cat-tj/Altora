import { NextResponse } from "next/server";
import { auth } from "../../../auth";
import { createMarketExpense } from "../../../lib/market-expenses";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = await request.json();
    const { outletId, category, amount, description } = body;
    if (!outletId || !category || !amount) {
      return NextResponse.json({ error: "outletId, category, amount wajib." }, { status: 400 });
    }
    const expense = await createMarketExpense({
      tenantId: session.user.tenantId ?? "default",
      outletId,
      category,
      amount: Number(amount),
      description: description || "",
      createdById: session.user.id ?? "",
    });
    return NextResponse.json({ expense }, { status: 201 });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
