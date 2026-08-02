# Altora Market

Aplikasi retail Altora untuk kasir, katalog, stok outlet, dan penutupan shift.

## Status

Versi `0.2.0` adalah rilis MVP operasional yang memakai data tenant/outlet
sebenarnya: login, beranda, katalog produk, shift kasir, checkout idempoten,
riwayat/struk transaksi, pembatalan oleh pemilik/manajer, dan tutup shift.

Ini bukan klaim seluruh modul ShadyERP telah bermigrasi. Penerimaan stok,
supplier, promo, member, retur, impor, dan laporan lanjutan belum tersedia
di navigasi Market baru.

## Jalankan lokal

```bash
npm run dev:market
```

Market memakai port `3002` untuk pengembangan. Aplikasi membutuhkan
`DATABASE_URL` PostgreSQL yang berisi tabel Market kompatibel dan
`AUTH_SECRET`; simpan keduanya hanya di environment, bukan source control.

## Batas domain

- Market memiliki katalog/harga retail, checkout, shift, transaksi, dan stok.
- Market tidak boleh memuat meja, dapur, resep, atau modifier Resto.
- Kode lintas produk hanya lewat `packages/`, bukan import dari `apps/resto`.

## Batas rilis 0.2.0

- Checkout mengurangi stok di transaksi database dan memiliki kunci request
  idempoten untuk mencegah pengurangan ganda saat request yang sama dikirim ulang.
- Pembatalan mengembalikan stok dan menulis jejak audit.
- Penutupan shift meminta alasan ketika selisih kas melebihi Rp10.000.
- Belum ada unique index database untuk request idempotensi; advisory lock
  melindungi writer aplikasi ini, dan index non-destruktif harus ditambahkan
  sebelum ada writer/integrasi lain pada tabel `Sale`.

Lihat [kontrak migrasi](../../docs/migrations/MARKET-MIGRATION-CONTRACT.md).
