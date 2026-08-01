# Loop Migrasi Produk Altora

Setiap produk diproses dengan urutan tetap agar monorepo tidak kembali menjadi
salinan ShadyERP yang sulit dioperasikan.

1. Audit donor: rute, visual, domain, dan risiko keamanan.
2. Tetapkan kontrak migrasi: apa yang dipindah, ditulis ulang, dan dilarang.
3. Port satu alur vertikal yang dapat diuji, bukan seluruh source tree.
4. Tulis dan jalankan test domain, lalu lint/typecheck/build.
5. Render 375×812, 768×1024, dan 1440×900; lakukan review aksesibilitas.
6. Lakukan review independen dan koreksi temuan.
7. Commit lokal kecil; naikkan versi dan tag hanya setelah user menguji.

## Status saat ini

| Produk | Fase | Status | Catatan |
| --- | --- | --- | --- |
| Market | 1–6 | Baseline UI lokal | Shell, Beranda, katalog, dan keranjang demo sudah dipindah. Auth, database, transaksi, inventory ledger, dan E2E nyata belum ada. |
| Resto | 1–2 | Rename dan audit awal | `Cafe` sudah menjadi `Resto`; alur yang akan dipindah berikutnya: meja → pesanan → dapur → pembayaran. |
| Teams | 1 | Menunggu | Donor landing sudah diidentifikasi; target produk akan diarahkan sebagai aplikasi Teams, bukan landing umum kedua. |

Tidak ada tahap yang memberi izin untuk push, tag rilis baru, perubahan DNS, atau
deployment VPS. Itu tetap memerlukan pengujian dan persetujuan user.
