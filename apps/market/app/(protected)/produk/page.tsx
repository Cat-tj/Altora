import { auth } from "../../../auth";
import { listMarketProducts } from "../../../lib/market-products";
import { EmptyMarketState, formatRupiah } from "../market-page-ui";

export default async function ProductsPage() {
  const session = await auth();
  const user = session!.user as { id: string; tenantId: string; role: "OWNER" | "MANAGER" | "STAFF" };
  const products = await listMarketProducts(user.tenantId, user.id, user.role);
  return <div className="market-stack"><div className="market-page-title"><div><p>Produk & stok</p><h1>Katalog retail</h1><span>Harga dan stok dari data Market pada outlet yang Anda akses.</span></div></div><section className="market-panel market-product-table"><div className="market-panel-heading"><div><h2>Produk aktif</h2><p>{products.length} produk retail tersedia.</p></div></div>{products.length ? <div className="market-table-scroll"><table><caption className="sr-only">Daftar produk retail aktif</caption><thead><tr><th scope="col">Produk</th><th scope="col">SKU / Barcode</th><th scope="col">Kategori</th><th scope="col">Stok</th><th scope="col">Harga</th></tr></thead><tbody>{products.map((product) => <tr key={product.id}><td><strong>{product.name}</strong></td><td>{product.sku ?? "—"}</td><td>{product.category}</td><td>{product.stock}</td><td>{formatRupiah(product.price)}</td></tr>)}</tbody></table></div> : <EmptyMarketState title="Belum ada produk retail" description="Produk aktif akan muncul di sini setelah ditambahkan pada katalog Market." />}</section></div>;
}
