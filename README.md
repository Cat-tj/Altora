# Altora

Monorepo baru untuk produk Altora. Repository ini menggantikan pola aplikasi
raksasa yang mencampur semua vertical dalam satu source tree.

## Aplikasi awal

- `apps/landing` — satu landing utama Altora.
- `apps/cafe` — aplikasi Altora Cafe.
- `apps/market` — aplikasi Altora Market.
- `apps/admin` — area internal Super Admin.

Lihat [batas produk](./docs/architecture/PRODUCT-BOUNDARIES.md) dan
[aturan versi](./docs/operations/VERSIONING.md) sebelum menambah fitur.

## Perintah

```bash
npm install
npm run check:boundaries
npm test
npm run lint
npm run check-types
npm run build
```

Repo lama ShadyERP dan Altora-Factory adalah donor kode/arsip. Jangan copy
seluruhnya; migrasikan per alur yang sudah diaudit dan diuji.
