# Altora Resto

Aplikasi F&B Altora untuk konteks meja, pesanan masuk, dapur, modifier menu,
dan handoff pembayaran kasir.

## Status

`apps/resto` adalah target migrasi setelah Market. Alur pertama yang akan
dipindahkan dari donor: meja → pesanan → dapur → pembayaran.

## Jalankan lokal

```bash
npm run dev:resto
```

Resto memakai port `3001`.

## Batas domain

- Resto memiliki meja, dine-in/take-away, dapur, dan modifier menu.
- Resto tidak boleh mengambil katalog barcode atau aturan stok retail Market.
- Kode lintas produk hanya lewat `packages/`, bukan import dari `apps/market`.
