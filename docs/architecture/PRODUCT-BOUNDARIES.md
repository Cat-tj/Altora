# Batas Produk Altora

Setiap aplikasi adalah batas produk mandiri:

- `apps/landing` melayani satu landing utama di `altora.my.id`.
- `apps/resto` melayani aplikasi Altora Resto.
- `apps/market` melayani aplikasi Altora Market.
- `apps/admin` melayani area internal Super Admin.

Tidak ada aplikasi yang boleh mengimpor source dari aplikasi produk lain. Kode
bersama hanya boleh dipakai melalui `packages/`:

- `@altora/ui`: frame dan komponen tampilan bersama.
- `@altora/core`: katalog produk dan aturan inti non-domain.
- `@altora/pos-core`: kontrak checkout yang benar-benar sama.
- `@altora/resto-pos`: aturan Resto, seperti meja dan service type.
- `@altora/market-pos`: aturan Market, seperti barcode dan satuan.

Script `npm run check:boundaries` memblokir import langsung antar semua aplikasi
produk. Aplikasi hanya boleh memakai kontrak eksplisit dari `packages/`.
