# Checklist Audit POS Altora Market

> Standar: POS produksi proper (Moka/Pawoon/Majoo/ShadyERP). Tiap item: ⬜ belum, ✅ pass, ❌ fail (catat detail).

## A. Fungsi Dasar Kasir
- [ ] A1. Login → redirect ke /kasir, session bertahan (refresh tidak logout)
- [ ] A2. Search produk by nama (fuzzy, sebagian kata)
- [ ] A3. Search by SKU / barcode (Enter = add langsung?)
- [ ] A4. Kategori filter (chip) bekerja, count benar
- [ ] A5. Tap card produk → masuk cart (qty 1)
- [ ] A6. Tap berulang → qty bertambah
- [ ] A7. Stepper −/+ di cart benar, min 1 (tidak bisa 0)
- [ ] A8. Hapus item (Hapus) → hilang dari cart, total update
- [ ] A9. Subtotal = Σ price×qty − diskon item
- [ ] A10. Diskon transaksi (Rp) → total update
- [ ] A11. Promo BOGO auto-apply (beli 2 gratis 1) — diskon item termurah, multi-set
- [ ] A12. Promo DISCOUNT (persen/nominal) auto-apply, min belanja dihormati
- [ ] A13. Badge promo di product card hanya untuk produk eligible
- [ ] A14. Produk habis: tidak bisa di-add, visual grey + ribbon
- [ ] A15. Qty max = stok (tidak bisa over-stok)
- [ ] A16. Produk tanpa stok (trackStock=false): bisa add bebas
- [ ] A17. Search tidak ada hasil → empty state
- [ ] A18. Total konsisten di tombol Bayar

## B. Member & Poin
- [ ] B1. Pilih member → nama tampil di cart
- [ ] B2. Clear member → hilang
- [ ] B3. (Kalau ada) poin dihitung dari total belanja
- [ ] B4. Member picker: search + list

## C. Pembayaran
- [ ] C1. Klik Bayar → sheet/modal muncul
- [ ] C2. 6 metode tampil: Tunai, QRIS, Transfer, E-Wallet, Deposit, Gift Card
- [ ] C3. Input nominal bayar → kembalian dihitung benar
- [ ] C4. Nominal kurang dari total → error/block
- [ ] C5. Metode non-tunai → tanpa input nominal langsung bisa?
- [ ] C6. Split payment (2 metode) — kalau ada
- [ ] C7. Tombol quick amount (uang pas / 50rb / 100rb) — kalau ada
- [ ] C8. Submit transaksi → success state, cart kosong
- [ ] C9. Double-submit tidak bikin transaksi ganda
- [ ] C10. Cancel/close modal → cart tetap utuh

## D. Shift & Riwayat
- [ ] D1. Buka shift: ada shift aktif di /kasir
- [ ] D2. Transaksi tercatat di Riwayat (jumlah, metode, total)
- [ ] D3. Detail transaksi bisa dibuka
- [ ] D4. Tutup shift: ringkasan muncul, shift nonaktif
- [ ] D5. Tutup shift dengan transaksi → saldo/ringkasan benar

## E. Integritas Data (server-side)
- [ ] E1. Setelah transaksi: stok produk berkurang sesuai qty
- [ ] E2. Promo discount tercatat di transaksi (bukan cuma tampilan)
- [ ] E3. Diskon item + transaksi tercatat
- [ ] E4. Poin member bertambah (kalau ada)
- [ ] E5. Sale + SaleItem dibuat (jumlah item benar)
- [ ] E6. Payment method tercatat

## F. Stress Test
- [ ] F1. Add 20+ item cepat (klik beruntun) → cart konsisten, tidak lag parah
- [ ] F2. Cart 10+ line item → scroll, total benar
- [ ] F3. Qty besar (999) → tidak crash, stok limit jalan
- [ ] F4. Buka/tutup payment sheet berulang → tidak duplikat
- [ ] F5. Refresh di tengah transaksi → cart hilang tapi tidak corrupt (wajar)
- [ ] F6. Backend: transaksi berturut-turut → stock konsisten (Σ qty terjual = stok awal − stok akhir)

## G. Mobile
- [ ] G1. Layout mobile: cart jadi sheet/bottom bar
- [ ] G2. Payment sheet mobile OK
- [ ] G3. Tap area cukup besar (44px+)

## H. UI/UX (untuk review AI)
- [ ] H1. Screenshot: POS kosong
- [ ] H2. Screenshot: cart isi + promo
- [ ] H3. Screenshot: payment sheet
- [ ] H4. Screenshot: success transaksi
- [ ] H5. Screenshot: riwayat
- [ ] H6. Screenshot: mobile
