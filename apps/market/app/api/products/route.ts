import { NextResponse } from "next/server";
import { auth } from "../../../auth";
import { createMarketProduct } from "../../../lib/market-products";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = session.user as { tenantId?: string; role?: string };
  if (!user.tenantId) return NextResponse.json({ error: "Tenant tidak ditemukan" }, { status: 400 });
  if (user.role !== "OWNER" && user.role !== "MANAGER") {
    return NextResponse.json({ error: "Hanya pemilik & manajer yang bisa menambah produk" }, { status: 403 });
  }

  const form = await request.formData();
  const name = String(form.get("name") ?? "").trim();
  if (!name) return NextResponse.json({ error: "Nama produk wajib diisi" }, { status: 400 });

  const sku = String(form.get("sku") ?? "").trim() || undefined;
  const categoryId = String(form.get("categoryId") ?? "").trim() || undefined;
  const price = Number(form.get("price") ?? 0);
  if (price <= 0) return NextResponse.json({ error: "Harga harus lebih dari 0" }, { status: 400 });

  const cost = form.get("cost") ? Number(form.get("cost")) : undefined;

  try {
    await createMarketProduct({
      tenantId: user.tenantId,
      name,
      sku,
      categoryId,
      price,
      cost,
      trackStock: true,
    });

    return NextResponse.redirect(new URL("/produk?created=1", request.url));
  } catch (error) {
    console.error("Create product failed:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Gagal menambah produk" }, { status: 500 });
  }
}
