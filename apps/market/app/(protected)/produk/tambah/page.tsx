import { requireRole } from "../../../lib/market-authz";
import { listMarketCategories } from "../../../lib/market-products";
import Link from "next/link";

export default async function TambahProdukPage() {
  const user = await requireRole(["OWNER", "MANAGER"]);
  const categories = await listMarketCategories(user.tenantId);

  return (
    <div className="market-stack">
      <div className="market-page-title">
        <div>
          <p>Produk</p>
          <h1>Tambah produk baru</h1>
          <span>Isi data produk retail untuk ditambahkan ke katalog.</span>
        </div>
        <Link href="/produk" style={{
          display: "inline-flex", alignItems: "center", gap: ".4rem",
          height: 36, padding: "0 .9rem", borderRadius: 8,
          background: "var(--line)", color: "var(--ink)",
          fontWeight: 700, fontSize: ".78rem", textDecoration: "none",
        }}>
          ← Kembali
        </Link>
      </div>

      <section className="market-panel" style={{ maxWidth: 560 }}>
        <form action="/api/products" method="POST" style={{ display: "grid", gap: "1rem", padding: "1.5rem" }}>
          <div>
            <label htmlFor="name" style={{ display: "block", fontSize: "0.875rem", fontWeight: "600", marginBottom: "0.5rem", color: "var(--ink)" }}>
              Nama Produk *
            </label>
            <input
              id="name" name="name" type="text" required
              placeholder="Contoh: Indomie Goreng"
              style={{ width: "100%", height: "52px", borderRadius: "999px", border: "1px solid var(--line)", padding: "0 1.25rem", fontSize: "1rem", boxSizing: "border-box" }}
            />
          </div>

          <div>
            <label htmlFor="sku" style={{ display: "block", fontSize: "0.875rem", fontWeight: "600", marginBottom: "0.5rem", color: "var(--ink)" }}>
              SKU / Barcode
            </label>
            <input
              id="sku" name="sku" type="text"
              placeholder="8997001201001"
              style={{ width: "100%", height: "52px", borderRadius: "999px", border: "1px solid var(--line)", padding: "0 1.25rem", fontSize: "1rem", boxSizing: "border-box" }}
            />
          </div>

          <div>
            <label htmlFor="categoryId" style={{ display: "block", fontSize: "0.875rem", fontWeight: "600", marginBottom: "0.5rem", color: "var(--ink)" }}>
              Kategori
            </label>
            <select
              id="categoryId" name="categoryId"
              style={{ width: "100%", height: "52px", borderRadius: "999px", border: "1px solid var(--line)", padding: "0 1.25rem", fontSize: "1rem", boxSizing: "border-box", background: "#fff" }}
            >
              <option value="">— Pilih kategori —</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="price" style={{ display: "block", fontSize: "0.875rem", fontWeight: "600", marginBottom: "0.5rem", color: "var(--ink)" }}>
              Harga Jual (Rp) *
            </label>
            <input
              id="price" name="price" type="number" min="1" required
              placeholder="Contoh: 3200"
              style={{ width: "100%", height: "52px", borderRadius: "999px", border: "1px solid var(--line)", padding: "0 1.25rem", fontSize: "1rem", boxSizing: "border-box" }}
            />
          </div>

          <div>
            <label htmlFor="cost" style={{ display: "block", fontSize: "0.875rem", fontWeight: "600", marginBottom: "0.5rem", color: "var(--ink)" }}>
              Harga Beli / Modal (Rp) — opsional
            </label>
            <input
              id="cost" name="cost" type="number" min="0"
              placeholder="Contoh: 2500"
              style={{ width: "100%", height: "52px", borderRadius: "999px", border: "1px solid var(--line)", padding: "0 1.25rem", fontSize: "1rem", boxSizing: "border-box" }}
            />
          </div>

          <button type="submit" style={{
            width: "100%", height: "52px", borderRadius: "999px",
            backgroundColor: "var(--accent)", color: "#fff",
            fontWeight: "700", border: "none", marginTop: "0.5rem", cursor: "pointer",
          }}>
            Simpan Produk
          </button>
        </form>
      </section>
    </div>
  );
}
