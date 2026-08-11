import { NextResponse } from "next/server";
import { createServiceSale } from "../../../../lib/service-db";
import {
  resolveServiceContext,
  ServiceAuthError,
} from "../../../../lib/service-auth";

export async function POST(request: Request) {
  try {
    const { ctx } = await resolveServiceContext(request);
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
    if (error instanceof ServiceAuthError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode },
      );
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Checkout gagal." },
      { status: 400 },
    );
  }
}
