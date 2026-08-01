import { getProduct } from "@altora/core/product-catalog";
import { AppFrame } from "@altora/ui/app-frame";

export default function MarketPage() {
  const product = getProduct("market");

  return (
    <AppFrame eyebrow="Aplikasi operasional" title="Altora Market" version={product.version}>
      <p className="lede">Ruang kerja retail yang disiapkan untuk barcode, satuan dan kemasan, harga grosir, serta stok toko.</p>
      <section className="panel" aria-labelledby="market-status-title">
        <h2 id="market-status-title">Fondasi Market</h2>
        <ul>
          <li>POS retail akan memakai kontrak checkout bersama dari <code>@altora/pos-core</code>.</li>
          <li>Barcode, unit produk, harga grosir, dan retur retail tetap khusus Market.</li>
          <li>Login dan data operasional belum dihubungkan pada bootstrap ini.</li>
        </ul>
      </section>
      <a className="text-link" href="https://altora.my.id">Kembali ke halaman utama Altora</a>
    </AppFrame>
  );
}
