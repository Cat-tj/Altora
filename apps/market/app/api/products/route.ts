import { NextResponse } from "next/server";
import { auth } from "../../../auth";
import { createMarketProduct, updateMarketProduct, deleteMarketProduct } from "../../../lib/market-products";

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
  const trackExpiry = form.get("trackExpiry") === "true";
  const expiredAt = form.get("expiredAt") ? String(form.get("expiredAt")) : null;

  try {
    await createMarketProduct({
      tenantId: user.tenantId,
      name,
      sku,
      categoryId,
      price,
      cost,
      trackStock: true,
      trackExpiry,
      expiredAt,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Create product failed:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Gagal menambah produk" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = session.user as { tenantId?: string; role?: string };
  if (!user.tenantId) return NextResponse.json({ error: "Tenant tidak ditemukan" }, { status: 400 });
  if (user.role !== "OWNER" && user.role !== "MANAGER") {
    return NextResponse.json({ error: "Hanya pemilik & manajer yang bisa mengubah produk" }, { status: 403 });
  }

  const form = await request.formData();
  const id = String(form.get("id") ?? "").trim();
  if (!id) return NextResponse.json({ error: "ID produk wajib ada" }, { status: 400 });

  const name = String(form.get("name") ?? "").trim();
  if (!name) return NextResponse.json({ error: "Nama produk wajib diisi" }, { status: 400 });

  const sku = String(form.get("sku") ?? "").trim() || undefined;
  const categoryId = String(form.get("categoryId") ?? "").trim() || undefined;
  const price = Number(form.get("price") ?? 0);
  if (price <= 0) return NextResponse.json({ error: "Harga harus lebih dari 0" }, { status: 400 });

  const cost = form.get("cost") ? Number(form.get("cost")) : undefined;
  const trackExpiry = form.get("trackExpiry") === "true";
  const expiredAt = form.get("expiredAt") ? String(form.get("expiredAt")) : null;

  try {
    await updateMarketProduct({
      id,
      tenantId: user.tenantId,
      name,
      sku,
      categoryId,
      price,
      cost,
      trackExpiry,
      expiredAt,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Update product failed:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Gagal memperbarui produk" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = session.user as { tenantId?: string; role?: string };
  if (!user.tenantId) return NextResponse.json({ error: "Tenant tidak ditemukan" }, { status: 400 });
  if (user.role !== "OWNER" && user.role !== "MANAGER") {
    return NextResponse.json({ error: "Hanya pemilik & manajer yang bisa menghapus produk" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID produk wajib diisi" }, { status: 400 });

  try {
    await deleteMarketProduct(id, user.tenantId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete product failed:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Gagal menghapus produk" }, { status: 500 });
  }
}
