# Kontrak Migrasi Altora Market

## Tujuan rilis 0.2.6

Memindahkan slice operasional Market dari donor ShadyERP ke `apps/market`
tanpa menjadikan donor sebagai kontrak arsitektur atau menyalin domain
Cafe/Resto.

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
| `src/components/market-shell.tsx` | `apps/market/app/market-shell.tsx` + CSS | Port struktur/istilah; Auth.js dan role diimplementasikan sendiri. |
| `simple/hari-ini/page.tsx` | `app/(protected)/simple/hari-ini/page.tsx` | KPI memakai data tenant/outlet sebenarnya. |
| `kasir/page.tsx` + `pos-screen.tsx` | `app/(protected)/kasir/*` + `lib/market-pos.ts` | Shift, katalog, checkout idempoten, stok atomik, riwayat, struk, pembatalan, dan tutup shift. |
| `produk/page.tsx` | `app/(protected)/produk/page.tsx` | Katalog dan stok baca-saja; CRUD, ledger, dan impor belum dipindah. |

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

## Tidak dipindahkan pada rilis 0.2.6

- Promo, member, retur/refund, supplier, penerimaan barang, stock opname,
  impor, laporan lanjutan, dan sinkronisasi offline.
- CRUD katalog dan ledger stok append-only. Pembatalan saat ini mengembalikan
  saldo `ProductStock` dan mencatat `AuditLog`; ledger penuh tetap pekerjaan
  rilis selanjutnya.
- Semua domain meja, dapur, pesanan makan di tempat, modifier menu, dan
  katering. Ini milik Altora Resto, bukan Market.

## Bukti yang dibutuhkan sebelum Market dapat disebut siap pakai

1. Auth dan batas tenant/outlet di sisi server.
2. Transaksi idempoten melalui `MarketCheckoutRequest` dan pengurangan/
   pengembalian stok atomik.
3. E2E login, redirect, shell desktop/mobile, serta uji integrasi database
   untuk checkout, pembatalan, dan tutup shift.
4. Review visual 375×812, 768×1024, dan 1440×900, plus audit aksesibilitas.
5. Uji healthcheck/rollback pada VPS dan verifikasi schema sebelum cutover.
