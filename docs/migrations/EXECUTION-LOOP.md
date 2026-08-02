# Loop Migrasi Produk Altora

Setiap produk diproses dengan urutan tetap agar monorepo tidak kembali menjadi
salinan ShadyERP yang sulit dioperasikan.

1. Audit donor: rute, visual, domain, dan risiko keamanan.
2. Tetapkan kontrak migrasi: apa yang dipindah, ditulis ulang, dan dilarang.
3. Port satu alur vertikal yang dapat diuji, bukan seluruh source tree.
4. Tulis dan jalankan test domain, lalu lint/typecheck/build.
5. Render 375×812, 768×1024, dan 1440×900; lakukan review aksesibilitas.
6. Lakukan review independen dan koreksi temuan.
7. Commit lokal kecil; naikkan versi dan tag setelah seluruh gate teknis,
   review independen, dan otorisasi rilis terpenuhi.

## Status saat ini

| Produk | Fase | Status | Catatan |
| --- | --- | --- | --- |
| Market | 3–6 | MVP operasional diuji lokal | Login, beranda, produk, shift/POS, transaksi, struk, void, dan tutup shift sudah dipindah. Promo, retur, receiving, supplier, impor, dan laporan lanjutan belum dipindah; VPS hanya boleh cutover sesudah schema, healthcheck, rollback, dan review visual final. |
| Resto | 1–2 | Rename dan audit awal | `Cafe` sudah menjadi `Resto`; alur berikutnya: meja → pesanan → dapur → pembayaran. |
| Teams | 1 | Menunggu | Donor landing diidentifikasi; Teams akan menjadi produk aplikasi/entry point, bukan landing umum kedua. |

Push/tag/deployment VPS hanya boleh dilakukan setelah bukti pengujian lengkap
dan otorisasi rilis eksplisit. Otorisasi ini tidak menghapus gate schema,
healthcheck, atau rollback.

## Bukti iterasi Market: kontrak rute

- Source audit menemukan `MarketShell` donor melakukan logout dengan callback
  relatif `"/login"`; ini tidak boleh ikut dipindah karena login dapat salah
  origin setelah Market berdiri sendiri.
- Kontrak yang diuji menerima origin lokal aktif dan host Market produksi saja;
  origin asing atau aplikasi Altora lain kembali ke login Market.
- Review aksesibilitas mencakup login, navigasi desktop/mobile, fokus, dan
  status transaksi. Tetap lakukan smoke test keyboard dan visual viewport pada
  build rilis sebelum cutover VPS.

## Perapian monorepo

- Manifest katalog produk sekarang menentukan folder aplikasi dan prefix tag
  rilis setiap produk.
- Semua `apps/*` wajib punya README produk, bukan README template Next.js.
- Boundary check sekarang melarang import langsung untuk semua aplikasi produk,
  bukan hanya Market dan Resto.
