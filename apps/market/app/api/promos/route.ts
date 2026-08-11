import { NextResponse } from "next/server";
import { auth } from "../../../auth";
import { createMarketPromo } from "../../../lib/market-promos";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = session.user as { tenantId?: string; role?: string };
  if (!user.tenantId) return NextResponse.json({ error: "Tenant tidak ditemukan" }, { status: 400 });
  if (user.role !== "OWNER" && user.role !== "MANAGER") {
    return NextResponse.json({ error: "Hanya pemilik & manajer yang bisa membuat promo" }, { status: 403 });
  }

  const form = await request.formData();
  const name = String(form.get("name") ?? "").trim();
  if (!name) return NextResponse.json({ error: "Nama promo wajib diisi" }, { status: 400 });

  const ruleTypeRaw = String(form.get("ruleType") ?? "DISCOUNT").toUpperCase();
  const ruleType = ruleTypeRaw === "BOGO" ? "BUY_X_GET_Y" : ruleTypeRaw;
  const minPurchase = Number(form.get("minPurchase") ?? 0) || 0;

  try {
    if (ruleType === "BUY_X_GET_Y") {
      const qualifyingQty = Number(form.get("qualifyingQty") ?? 2) || 2;
      const rewardQty = Number(form.get("rewardQty") ?? 1) || 1;
      const rewardDiscountPercent = Number(form.get("rewardDiscountPercent") ?? 100) || 100;
      if (qualifyingQty < 1 || rewardQty < 1) {
        return NextResponse.json({ error: "Jumlah beli & gratis minimal 1" }, { status: 400 });
      }
      await createMarketPromo({
        tenantId: user.tenantId,
        name,
        ruleType: "BUY_X_GET_Y",
        minPurchase,
        qualifyingQty,
        rewardQty,
        rewardDiscountPercent,
        qualifyingCategoryId: String(form.get("qualifyingCategoryId") ?? "") || undefined,
      });
    } else if (ruleType === "BULK") {
      const qualifyingQty = Number(form.get("qualifyingQty") ?? 5) || 5;
      const rewardDiscountPercent = Number(form.get("rewardDiscountPercent") ?? 10) || 10;
      await createMarketPromo({
        tenantId: user.tenantId,
        name,
        ruleType: "BULK",
        minPurchase,
        qualifyingQty,
        rewardDiscountPercent,
        qualifyingCategoryId: String(form.get("qualifyingCategoryId") ?? "") || undefined,
      });
    } else {
      const discountPercent = form.get("discountPercent") ? Number(form.get("discountPercent")) : null;
      const discountAmount = form.get("discountAmount") ? Number(form.get("discountAmount")) : null;
      await createMarketPromo({
        tenantId: user.tenantId,
        name,
        ruleType: "DISCOUNT",
        discountPercent: discountPercent && discountPercent > 0 ? discountPercent : undefined,
        discountAmount: discountAmount && discountAmount > 0 ? discountAmount : undefined,
        minPurchase,
      });
    }

    return NextResponse.redirect(new URL("/promo?created=1", request.url));
  } catch (error) {
    console.error("Create promo failed:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Gagal membuat promo" }, { status: 500 });
  }
}
