import { getProduct } from "@altora/core/product-catalog";
import { AppFrame } from "@altora/ui/app-frame";

export default function RestoPage() {
  const product = getProduct("resto");

  return (
    <AppFrame eyebrow="Aplikasi operasional" title="Altora Resto" version={product.version}>
      <p className="lede">Ruang kerja khusus untuk bisnis F&B: pesanan, meja, modifier menu, dan alur menuju dapur.</p>
      <section className="panel" aria-labelledby="resto-status-title">
        <h2 id="resto-status-title">Fondasi Resto</h2>
        <ul>
          <li>POS Resto akan memakai kontrak checkout bersama dari <code>@altora/pos-core</code>.</li>
          <li>Meja, dine-in, modifier, dan kitchen workflow tetap khusus Resto.</li>
          <li>Login dan data operasional belum dihubungkan pada bootstrap ini.</li>
        </ul>
      </section>
      <a className="text-link" href="https://altora.my.id">Kembali ke halaman utama Altora</a>
    </AppFrame>
  );
}
