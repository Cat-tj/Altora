import { NextResponse } from "next/server";
import { auth } from "../../../../auth";
import { db } from "../../../../lib/db";
import { normalizeStaticQris } from "../../../../lib/market-qris";

type User = { id: string; tenantId: string; role: "OWNER" | "MANAGER" | "STAFF" };

/** Simpan pengaturan bisnis (pajak, footer struk, QRIS statis, diskon kadaluwarsa). */
export async function POST(request: Request) {
  const session = await auth();
  const user = session?.user as User | undefined;
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role !== "OWNER") return NextResponse.json({ error: "Hanya pemilik yang dapat mengubah pengaturan." }, { status: 403 });

  const form = await request.formData();
  const taxPercent = Number(String(form.get("taxPercent") ?? "0"));
  const receiptFooter = String(form.get("receiptFooter") ?? "").trim();
  const rawQris = String(form.get("staticQrisPayload") ?? "").trim();

  // Expire discount fields
  const expireDiscountEnabled = form.get("expireDiscountEnabled") === "true";
  const expireDiscountMode = form.get("expireDiscountMode") === "auto" ? "auto" : "manual";
  const expireDiscountDays = Math.max(1, Math.min(365, Number(String(form.get("expireDiscountDays") ?? "30"))));
  const expireDiscountPercent = Math.max(1, Math.min(100, Number(String(form.get("expireDiscountPercent") ?? "20"))));

  if (!Number.isSafeInteger(taxPercent) || taxPercent < 0 || taxPercent > 100) {
    return NextResponse.json({ error: "Pajak harus angka 0–100." }, { status: 400 });
  }

  let staticQrisPayload: string | null = null;
  if (rawQris) {
    try {
      staticQrisPayload = normalizeStaticQris(rawQris);
    } catch (e) {
      return NextResponse.json({ error: e instanceof Error ? e.message : "Payload QRIS tidak valid." }, { status: 400 });
    }
  }

  await db.query(
    `UPDATE "TenantSetting"
     SET "taxPercent" = $2,
         "receiptFooter" = $3,
         "staticQrisPayload" = $4,
         "expireDiscountEnabled" = $5,
         "expireDiscountMode" = $6,
         "expireDiscountDays" = $7,
         "expireDiscountPercent" = $8,
         "updatedAt" = NOW()
     WHERE "tenantId" = $1`,
    [user.tenantId, taxPercent, receiptFooter, staticQrisPayload,
     expireDiscountEnabled, expireDiscountMode, expireDiscountDays, expireDiscountPercent],
  );

  return NextResponse.json({ success: true });
}
