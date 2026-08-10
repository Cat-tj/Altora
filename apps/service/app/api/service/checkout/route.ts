import { NextResponse } from "next/server";
import { createServiceSale } from "../../../../lib/service-db";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const tenantId = request.headers.get("x-altora-tenant-id") ?? "seed_tenant_market";
    const userId = request.headers.get("x-altora-user-id") ?? "service-local-user";
    const result = await createServiceSale({ ctx: { tenantId, userId }, staffId: body.staffId, paymentMethod: body.paymentMethod ?? "CASH", requestId: body.requestId, items: body.items });
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Checkout gagal." }, { status: 400 });
  }
}
