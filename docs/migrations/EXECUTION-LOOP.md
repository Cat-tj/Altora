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
| Market | 1 | Audit source & kontrak redirect | Baseline UI lokal yang ada bukan source donor dan tidak akan dijadikan fondasi migrasi. Donor memakai `signOut({ callbackUrl: "/login" })`; ini berisiko salah host setelah ekstraksi. Kontrak baru mengizinkan callback hanya ke origin lokal aktif atau host produk yang tepat. Auth, database, transaksi, inventory ledger, dan E2E nyata belum ada. |
| Resto | 1–2 | Rename dan audit awal | `Cafe` sudah menjadi `Resto`; alur yang akan dipindah berikutnya: meja → pesanan → dapur → pembayaran. |
| Teams | 1 | Menunggu | Donor landing sudah diidentifikasi; target produk akan diarahkan sebagai aplikasi Teams, bukan landing umum kedua. |

Tidak ada tahap yang memberi izin untuk push, tag rilis baru, perubahan DNS, atau
deployment VPS. Itu tetap memerlukan pengujian dan persetujuan user.

## Bukti iterasi Market: kontrak rute

- Source audit menemukan `MarketShell` donor melakukan logout dengan callback
  relatif `"/login"`; ini tidak boleh ikut dipindah karena login dapat salah
  origin setelah Market berdiri sendiri.
- Kontrak yang diuji menerima origin lokal aktif dan host Market produksi saja;
  origin asing atau aplikasi Altora lain kembali ke login Market.
- Review aksesibilitas pada workspace lokal menghasilkan perbaikan heading grup
  navigasi, fokus setelah perubahan layar, live-region yang atomik, dan status
  navigasi cepat. Ini hanya valid untuk UI demonstrasi lokal; belum merupakan
  bukti aksesibilitas flow login atau transaksi yang terautentikasi.
