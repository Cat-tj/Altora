# Kontrak Migrasi Altora Market

## Tujuan iterasi pertama

Memindahkan pengalaman Market dari donor ShadyERP ke `apps/market` tanpa
menjadikan donor sebagai kontrak arsitektur atau menyalin domain Cafe/Resto.

## Baseline UI yang dijaga

- Shell retail teal: sidebar desktop, topbar outlet, dan navigasi cepat mobile.
- Beranda toko: KPI, tindakan operasional, produk terlaris, serta CTA Kasir.
- Kasir: cari produk/barcode, filter kategori, katalog retail, keranjang, dan
  kontrol kuantitas.
- Produk & stok: barcode, satuan, stok, dan harga retail.

Referensi visual donor berada di
`work/ShadyERP-master-consolidation/docs/market-isolated/screenshots/final/`.

## Pemetaan

| Donor ShadyERP | Target Altora | Keputusan |
| --- | --- | --- |
| `src/components/market-shell.tsx` | `apps/market/app/market-workspace.tsx` + CSS | Port struktur dan istilah, bukan implementasi NextAuth/role donor. |
| `simple/hari-ini/page.tsx` | layar Beranda pada `market-workspace.tsx` | Port komposisi; data KPI masih demonstrasi lokal. |
| `kasir/page.tsx` + `pos-screen.tsx` | layar Kasir + `apps/market/lib/market-pos.ts` | Port alur katalog/keranjang dari database tenant, shift, pembayaran dasar, transaksi, dan pengurangan stok atomik. Promo, member, retur, dan tutup shift belum dipindahkan. |
| `produk/page.tsx` | layar Produk & Stok | Port konsep retail; CRUD, stok ledger, dan impor belum dipindah. |

## Kontrak rute dan autentikasi

- Market memiliki login pada `/login` di origin Market sendiri.
- Saat lokal, logout harus kembali ke `http://localhost:3002/login` (atau port
  lokal aktif), bukan ke aplikasi Altora lain.
- Saat produksi, logout Market hanya boleh kembali ke
  `https://market.altora.my.id/login`.
- Callback dari origin lain, termasuk subdomain Altora lain, harus ditolak dan
  memakai fallback host Market. Tidak ada `localhost` yang boleh disimpan
  sebagai URL callback produksi.
- Source donor yang masih memakai `callbackUrl: "/login"` tidak boleh disalin
  apa adanya; integrasi Auth.js baru dilakukan sesudah login Market dan session
  tenant sudah dipindahkan bersama-sama.

## Tidak dipindahkan pada iterasi ini

- Auth, tenant/outlet persistence, role authorization, dan database.
- Pembayaran, shift, promosi, retur, supplier, barang masuk, audit log, dan
  sinkronisasi offline.
- Semua domain meja, dapur, pesanan makan di tempat, modifier menu, dan
  katering. Ini milik Altora Resto, bukan Market.

## Bukti yang dibutuhkan sebelum Market dapat disebut siap pakai

1. Auth dan batas tenant/outlet di sisi server.
2. Transaksi idempoten, stock movement append-only, dan rekonsiliasi stok.
3. E2E POS nyata dengan database seed termasuk otorisasi negatif.
4. Review visual 375×812, 768×1024, dan 1440×900, plus audit aksesibilitas.
5. Uji pemulihan, observabilitas, dan persetujuan user sebelum push/deploy.
