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
| Market | 1 | Audit source selesai | Donor asli aktif dan dapat login lokal memakai database yang kompatibel. `apps/market` masih baseline sementara dan tidak boleh dipakai sebagai source deploy sampai slice autentikasi + data Market dipindah. |
| Resto | 1–2 | Rename dan audit awal | `Cafe` sudah menjadi `Resto`; alur berikutnya: meja → pesanan → dapur → pembayaran. |
| Teams | 1 | Menunggu | Donor landing diidentifikasi; Teams akan menjadi produk aplikasi/entry point, bukan landing umum kedua. |

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

## Perapian monorepo

- Manifest katalog produk sekarang menentukan folder aplikasi dan prefix tag
  rilis setiap produk.
- Semua `apps/*` wajib punya README produk, bukan README template Next.js.
- Boundary check sekarang melarang import langsung untuk semua aplikasi produk,
  bukan hanya Market dan Resto.
