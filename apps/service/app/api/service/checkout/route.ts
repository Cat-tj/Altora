import { NextResponse } from "next/server";
import { createServiceSale } from "../../../../lib/service-db";
import { resolveServiceContext } from "../../../../lib/service-auth";

export async function POST(request: Request) {
  try {
    const { ctx } = resolveServiceContext(request);
    const body = await request.json();

    const result = await createServiceSale({
      ctx: {
        tenantId: ctx.tenantId,
        userId: ctx.userId,
        outletId: ctx.activeOutletId,
      },
      staffId: body.staffId,
      paymentMethod: body.paymentMethod ?? "CASH",
      requestId: body.requestId,
      items: body.items,
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Checkout gagal." },
      { status: 400 },
    );
  }
}
