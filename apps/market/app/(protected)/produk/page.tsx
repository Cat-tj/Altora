import { requireRole } from "../../../lib/market-authz";
import { listMarketProducts, listMarketCategories } from "../../../lib/market-products";
import { EmptyMarketState, formatRupiah } from "../market-page-ui";
import { ProductFormModal } from "./product-form-modal";
import { DeleteProductButton } from "./delete-product-button";

export default async function ProductsPage() {
  const user = await requireRole(["OWNER", "MANAGER"]);
  const [products, categories] = await Promise.all([
    listMarketProducts(user.tenantId, user.id, user.role),
    listMarketCategories(user.tenantId),
  ]);

  const now = new Date();
  const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const expiredProducts = products.filter(
    (p) => p.trackExpiry && p.expiredAt && new Date(p.expiredAt) <= now,
  );
  const nearExpiryProducts = products.filter(
    (p) =>
      p.trackExpiry &&
      p.expiredAt &&
      new Date(p.expiredAt) > now &&
      new Date(p.expiredAt) <= thirtyDaysLater,
  );

  return (
    <div className="market-stack">
      <div className="market-page-title">
        <div>
          <p>Produk & stok</p>
          <h1>Katalog retail</h1>
          <span>Harga, stok, dan tanggal kadaluwarsa produk retail pada outlet Anda.</span>
        </div>
        <ProductFormModal categories={categories} />
      </div>

      {/* Banner Peringatan Expired */}
      {(expiredProducts.length > 0 || nearExpiryProducts.length > 0) && (
        <div
          style={{
            padding: "0.85rem 1.1rem",
            borderRadius: 12,
            background: expiredProducts.length > 0 ? "#fef2f2" : "#fffbeb",
            border: `1px solid ${expiredProducts.length > 0 ? "#fecaca" : "#fde68a"}`,
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            color: expiredProducts.length > 0 ? "#991b1b" : "#92400e",
            fontSize: "0.84rem",
            fontWeight: 600,
          }}
        >
          <span style={{ fontSize: "1.2rem" }}>
            {expiredProducts.length > 0 ? "🚨" : "⚠️"}
          </span>
          <div>
            <strong>Perhatian Kadaluwarsa (Expired Alert):</strong>{" "}
            {expiredProducts.length > 0 && (
              <span>
                <strong>{expiredProducts.length} produk</strong> sudah kadaluwarsa.{" "}
              </span>
            )}
            {nearExpiryProducts.length > 0 && (
              <span>
                <strong>{nearExpiryProducts.length} produk</strong> akan kadaluwarsa dalam 30 hari ke depan.
              </span>
            )}
          </div>
        </div>
      )}

      <section className="market-panel market-product-table">
        <div className="market-panel-heading">
          <div>
            <h2>Produk aktif</h2>
            <p>{products.length} produk retail tersedia.</p>
          </div>
        </div>
        {products.length ? (
          <div className="market-table-scroll">
            <table>
              <caption className="sr-only">Daftar produk retail aktif</caption>
              <thead>
                <tr>
                  <th scope="col">Produk</th>
                  <th scope="col">SKU / Barcode</th>
                  <th scope="col">Kategori</th>
                  <th scope="col">Stok</th>
                  <th scope="col">Harga</th>
                  <th scope="col">Kadaluwarsa</th>
                  <th scope="col" style={{ width: 100, textAlign: "center" }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.id}>
                    <td><strong>{product.name}</strong></td>
                    <td>{product.sku ?? "—"}</td>
                    <td>{product.category}</td>
                    <td>{product.stock}</td>
                    <td>{formatRupiah(product.price)}</td>
                    <td>{renderExpiryBadge(product.trackExpiry, product.expiredAt)}</td>
                    <td style={{ textAlign: "center" }}>
                      <div style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem" }}>
                        <ProductFormModal
                          categories={categories}
                          productToEdit={product}
                          triggerButton={
                            <button
                              style={{
                                background: "none",
                                border: "none",
                                cursor: "pointer",
                                padding: "4px 8px",
                                borderRadius: 6,
                                fontSize: "0.85rem",
                              }}
                              title="Edit Produk"
                            >
                              ✏️
                            </button>
                          }
                        />
                        <DeleteProductButton productId={product.id} productName={product.name} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyMarketState title="Belum ada produk retail" description="Produk aktif akan muncul di sini setelah ditambahkan pada katalog Market." />
        )}
      </section>
    </div>
  );
}

function renderExpiryBadge(trackExpiry: boolean, expiredAt: string | null) {
  if (!trackExpiry || !expiredAt) {
    return <span style={{ color: "var(--muted)", fontSize: "0.78rem" }}>—</span>;
  }

  const expDate = new Date(expiredAt);
  const now = new Date();
  const diffDays = Math.ceil((expDate.getTime() - now.getTime()) / (1000 * 3600 * 24));

  const formattedDate = new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(expDate);

  if (diffDays <= 0) {
    return (
      <span
        style={{
          display: "inline-flex", alignItems: "center", gap: "4px",
          padding: "2px 8px", borderRadius: 12, background: "#fef2f2",
          color: "#dc2626", fontWeight: 700, fontSize: "0.72rem", border: "1px solid #fecaca",
        }}
        title={`Kadaluwarsa pada ${formattedDate}`}
      >
        🔴 Expired ({formattedDate})
      </span>
    );
  }

  if (diffDays <= 30) {
    return (
      <span
        style={{
          display: "inline-flex", alignItems: "center", gap: "4px",
          padding: "2px 8px", borderRadius: 12, background: "#fffbeb",
          color: "#d97706", fontWeight: 700, fontSize: "0.72rem", border: "1px solid #fde68a",
        }}
        title={`Kadaluwarsa dalam ${diffDays} hari (${formattedDate})`}
      >
        🟠 Exp {diffDays} hr lagi ({formattedDate})
      </span>
    );
  }

  return (
    <span
      style={{
        display: "inline-flex", alignItems: "center", gap: "4px",
        padding: "2px 8px", borderRadius: 12, background: "#ecfdf5",
        color: "#059669", fontWeight: 600, fontSize: "0.72rem", border: "1px solid #a7f3d0",
      }}
    >
      🟢 {formattedDate}
    </span>
  );
}
