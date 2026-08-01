import { getProduct } from "@altora/core/product-catalog";
import { AppFrame } from "@altora/ui/app-frame";

export default function AdminPage() {
  const product = getProduct("admin");

  return (
    <AppFrame eyebrow="Area internal" title="Altora Admin" version={product.version}>
      <p className="lede">Area ini disiapkan untuk administrasi platform, bukan untuk operasional tenant Cafe atau Market.</p>
      <section className="panel" aria-labelledby="admin-status-title">
        <h2 id="admin-status-title">Belum terhubung ke produksi</h2>
        <p>Autentikasi Super Admin, data tenant, entitlement, dan audit platform akan dibuat sebagai pekerjaan terpisah dengan pengujian keamanan.</p>
      </section>
      <a className="text-link" href="https://altora.my.id">Kembali ke halaman utama Altora</a>
    </AppFrame>
  );
}
