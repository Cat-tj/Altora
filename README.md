# Altora

Monorepo baru untuk produk Altora. Repository ini menggantikan pola aplikasi
raksasa yang mencampur semua vertical dalam satu source tree.

## Aplikasi awal

- `apps/landing` — satu landing utama Altora.
- `apps/resto` — aplikasi Altora Resto.
- `apps/market` — aplikasi Altora Market.
- `apps/admin` — area internal Super Admin.

Lihat [batas produk](./docs/architecture/PRODUCT-BOUNDARIES.md) dan
[aturan versi](./docs/operations/VERSIONING.md) sebelum menambah fitur.
Untuk tampilan, lihat [brand guide](./docs/design/BRAND-GUIDE.md) dan
[UI/UX guide](./docs/design/UI-UX-GUIDE.md).

## Perintah

```bash
npm install
npm run check:boundaries
npm run check:repository
npm test
npm run lint
npm run check-types
npm run build
```

Repo lama ShadyERP dan Altora-Factory adalah donor kode/arsip. Jangan copy
seluruhnya; migrasikan per alur yang sudah diaudit dan diuji.

## Aturan struktur

`apps/` hanya berisi produk yang ada di katalog `@altora/core`. Tiap produk
harus memiliki README yang menjelaskan pemilik domain, status, port lokal, dan
batasnya. Script `npm run check:repository` menjaga aturan ini supaya template
Next.js dan aplikasi yang tidak punya pemilik tidak masuk kembali.
