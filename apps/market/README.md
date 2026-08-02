# Altora Market

Aplikasi retail Altora untuk kasir barcode, katalog, stok, penerimaan barang,
supplier, promo, dan laporan outlet.

## Status

`apps/market` masih fondasi migrasi. Jangan menganggap layar demo sebagai
fitur siap pakai. Source donor yang benar ada di ShadyERP dan dipindahkan per
alur teruji: autentikasi → beranda → shift/POS → stok → laporan.

## Jalankan lokal

```bash
npm run dev:market
```

Market memakai port `3002`. Kontrak login, data retail, dan variabel
environment akan ditambahkan bersama slice autentikasi yang sebenarnya.

## Batas domain

- Market memiliki barcode, unit, harga retail, checkout, shift, dan stok.
- Market tidak boleh memuat meja, dapur, resep, atau modifier Resto.
- Kode lintas produk hanya lewat `packages/`, bukan import dari `apps/resto`.

Lihat [kontrak migrasi](../../docs/migrations/MARKET-MIGRATION-CONTRACT.md).
