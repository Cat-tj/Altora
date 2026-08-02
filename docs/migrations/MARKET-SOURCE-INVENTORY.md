# Inventaris Source Donor: Altora Market

Status audit: 2 Agustus 2026. Source donor dibaca dari checkout ShadyERP yang
dibekukan; tidak ada file donor yang dimutasi.

## Alur yang harus tetap ada

| Alur | Entrypoint donor | Pemilik data donor | Risiko saat dipindah |
| --- | --- | --- | --- |
| Shell & navigasi | `src/components/market-shell.tsx` | session, role, tenant | Logout memakai callback relatif `"/login"`; tidak boleh dipindah apa adanya. |
| Beranda operasional | `src/app/(app)/simple/hari-ini/page.tsx` | sales, shift, outlet, stok | Bergantung pada 29 file internal dan Prisma/Auth.js. |
| Kasir retail | `src/app/(app)/kasir/page.tsx` + `src/components/kasir/pos-screen.tsx` | shift, produk, promo, pembayaran | Bergantung pada 45 file internal; checkout, QRIS, serial, member, dan offline queue tidak boleh menjadi UI palsu. |
| Produk & stok | `src/app/(app)/inventory/page.tsx` + `src/components/produk/produk-manager.tsx` | produk, outlet, batch, modifier | Bergantung pada 39 file internal; perlu memisahkan konsep retail dari resep/modifier Resto. |

## Batas migrasi pertama

1. Pindahkan kontrak host/login dan shell autentikasi Market bersama-sama.
2. Pindahkan layar Beranda hanya setelah summary Market punya service dan
   source data sendiri.
3. Pindahkan Kasir sebagai satu alur utuh: buka shift → pilih barcode/produk →
   pembayaran → sale append-only → stock movement → riwayat.
4. Pindahkan katalog/stock sesudah model produk, satuan, barcode, dan ledger
   sudah menjadi kontrak Altora Market.

## Yang tidak boleh ikut terselundup

- Model meja, order makan di tempat, modifier menu, dan resep Resto.
- Hub, vertical, dan halaman generik ShadyERP di luar Market.
- URL callback absolut yang mengarah ke localhost atau produk Altora lain.
- Import aplikasi-ke-aplikasi. Kode yang benar-benar universal masuk
  `packages/`; data dan aturan retail tetap milik `apps/market`.

## Bukti audit

- `market-shell.tsx` hanya membutuhkan lima file internal, tetapi login/logout
  membutuhkan Auth.js dan harus diganti oleh kontrak host Market.
- Beranda, Kasir, dan stok menarik 29, 45, dan 39 file internal donor secara
  berurutan. Menyalin satu komponen tanpa service/database asalnya akan
  menghasilkan layar yang terlihat ada tetapi tidak dapat dioperasikan.
- `@altora/core/auth-redirect` sekarang menguji callback lokal, host Market,
  origin asing, dan upaya menuju produk Altora lain.
