import { NextResponse } from "next/server";
import { auth } from "../../../auth";
import { createMarketMember } from "../../../lib/market-members";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = session.user as { id?: string; tenantId?: string; role?: string };
  try {
    const body = await request.json();
    const { name, phone, email } = body;
    if (!name || !phone) {
      return NextResponse.json({ error: "Name & phone wajib." }, { status: 400 });
    }
    await createMarketMember({
      tenantId: user.tenantId ?? "default",
      name,
      phone,
      email: email || undefined,
    });
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
