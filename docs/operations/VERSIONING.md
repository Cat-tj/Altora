# Version Control dan Rilis Produk

## Aturan inti

- `master` adalah satu-satunya branch deploy.
- Branch kerja hanya untuk perubahan sementara; tidak pernah dijalankan di VPS.
- Setiap commit menjelaskan perubahan kecil yang dapat dilacak.
- Tag rilis adalah backup bernama yang tidak berubah.

## Versi per produk

Produk memiliki versi mandiri di `packages/core/src/product-catalog.js` dan
`package.json` aplikasinya. `appDirectory` dan `releaseTagPrefix` pada katalog
adalah manifest resmi; aplikasi tanpa manifest tidak boleh dibuat:

| Produk | Tag rilis |
| --- | --- |
| Landing Altora | `web-vX.Y.Z` |
| Altora Resto | `resto-vX.Y.Z` |
| Altora Market | `market-vX.Y.Z` |
| Altora Admin | `admin-vX.Y.Z` |
| Fondasi bersama | `platform-vX.Y.Z` |

`PATCH` untuk perbaikan aman, `MINOR` untuk fitur baru yang kompatibel, dan
`MAJOR` bila kontrak produk berubah secara tidak kompatibel.

## Proses update

1. Perubahan dibuat dan diuji lokal.
2. `npm run check:boundaries`, `npm test`, lint, typecheck, dan build harus lulus.
3. Commit masuk ke `master` setelah review.
4. Naikkan versi produk yang berubah dan buat tag lokal sesuai tabel.
5. User menguji sebelum push/deploy.
6. Setelah persetujuan, push `master` dan tag terkait; deployment mengambil commit/tag itu saja.

Tidak ada push atau deployment otomatis dari repository ini pada fase awal.
