import { NextResponse } from "next/server";
import { auth } from "../../../auth";
import { createMarketMember } from "../../../lib/market-members";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = await request.json();
    const { name, phone, email, point, tier } = body;
    if (!name || !phone) {
      return NextResponse.json({ error: "Name & phone wajib." }, { status: 400 });
    }
    const member = await createMarketMember({
      tenantId: session.user.tenantId ?? "default",
      name,
      phone,
      email: email || undefined,
      points: Number(point) || 0,
      tier: tier || "BASIC",
    });
    return NextResponse.json({ member }, { status: 201 });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
