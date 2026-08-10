import { NextResponse } from "next/server";
import { auth } from "../../../../auth";
import { db } from "../../../../lib/db";

type User = { id: string; tenantId: string; role: "OWNER" | "MANAGER" | "STAFF" };

export async function POST(request: Request) {
  const session = await auth();
  const user = session?.user as User | undefined;
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role !== "OWNER")
    return NextResponse.json({ error: "Hanya pemilik yang dapat mengubah pengaturan." }, { status: 403 });

  const form = await request.formData();
  const enabled = form.get("expireDiscountEnabled") === "true";
  const mode = form.get("expireDiscountMode") === "auto" ? "auto" : "manual";
  const days = Math.max(1, Math.min(365, Number(String(form.get("expireDiscountDays") ?? "30"))));
  const pct = Math.max(1, Math.min(100, Number(String(form.get("expireDiscountPercent") ?? "20"))));

  await db.query(
    `UPDATE "TenantSetting"
     SET "expireDiscountEnabled"  = $2,
         "expireDiscountMode"     = $3,
         "expireDiscountDays"     = $4,
         "expireDiscountPercent"  = $5,
         "updatedAt" = NOW()
     WHERE "tenantId" = $1`,
    [user.tenantId, enabled, mode, days, pct],
  );

  return NextResponse.json({ success: true });
}
