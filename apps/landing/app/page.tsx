import { getProduct } from "@altora/core/product-catalog";
import { AppFrame } from "@altora/ui/app-frame";
import { ProductCard } from "@altora/ui/product-card";

const resto = getProduct("resto");
const market = getProduct("market");

export default function LandingPage() {
  return (
    <AppFrame eyebrow="Platform bisnis" title="Satu Altora. Produk yang fokus." version={getProduct("landing").version}>
      <p className="lede">Pilih aplikasi yang sesuai dengan cara bisnis Anda bekerja. Setiap produk punya pengalaman dan versi rilisnya sendiri.</p>
      <section aria-labelledby="produk-title">
        <h2 id="produk-title">Produk yang sedang dibangun</h2>
        <div className="product-grid">
          <ProductCard href={resto.host} name={resto.name} version={resto.version}>POS dan operasional untuk kedai, restoran, dan bisnis F&B.</ProductCard>
          <ProductCard href={market.host} name={market.name} version={market.version}>Operasional retail untuk barcode, satuan produk, dan stok toko.</ProductCard>
        </div>
      </section>
      <section className="note" aria-labelledby="cara-kerja-title">
        <h2 id="cara-kerja-title">Cara kerja versi Altora</h2>
        <p>Altora Resto dan Altora Market rilis secara mandiri. Nomor versi di setiap aplikasi menunjukkan perubahan yang sudah diuji pada produk tersebut.</p>
      </section>
    </AppFrame>
  );
}
