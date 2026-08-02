# Brand Guide Altora

Identitas visual Altora: logo, warna, tipografi, fotografi, dan nada bicara.
Untuk aturan komponen dan layout, lihat [UI/UX Guide](./UI-UX-GUIDE.md).

Sumber kebenaran implementasi ada di CSS `apps/landing`. Kalau dokumen ini dan
kode berbeda, kode yang menang — perbarui dokumen ini, jangan sebaliknya.

## Posisi merek

Altora adalah sistem manajemen bisnis terintegrasi untuk pelaku usaha
Indonesia: kasir, stok, pembelian, dan keuangan dalam satu alur.

Yang dijual bukan kecanggihan teknologinya, tapi **ketenangan operasional**.
Pemilik toko tidak ingin belajar software; mereka ingin tahu stok tinggal
berapa dan hari ini untung berapa. Setiap keputusan desain diukur dari itu.

Konsekuensinya:

- Tunjukkan angka asli, bukan ilustrasi abstrak. Hero memakai dashboard
  sungguhan dengan Rp2,1jt dan 88 transaksi, bukan grafik hiasan.
- Bahasa operasional sehari-hari: "stok menipis", "barang masuk", "perlu
  restock". Bukan "inventory optimization".
- Tidak ada nada menggurui. Pengguna sudah paham bisnisnya; yang mereka
  butuhkan alat, bukan pelajaran.

## Logo

Simbol Altora adalah huruf "A" dengan pita yang melintas di dalamnya.

| Aset | Berkas | Dipakai di |
| --- | --- | --- |
| Simbol utama | `altora-symbol.svg` | Latar terang |
| Simbol terang | `altora-symbol-light.svg` | Latar gelap |

Badan "A" memakai gradien navy `#123766 → #082145 → #061A38`. Di latar gelap
navy itu hilang, jadi varian terang mengganti badan huruf dengan gradien
`#FFFFFF → #F3EEFF → #E4D9FF` sementara pitanya tetap ungu. **Jangan** menyiasati
ini dengan filter CSS — pakai berkas yang benar.

Pita memakai gradien ungu-magenta `#B198DD → #B96ECA → #C05BC8`. Ini elemen
paling khas dari merek; jangan diganti warna lain.

Wordmark "ALTORA" ditulis kapital, `font-weight: 800`, `letter-spacing: .02em`,
berdampingan dengan simbol dengan jarak 11px.

### Yang tidak boleh

- Mengubah proporsi simbol terhadap wordmark, atau memiringkannya.
- Menaruh simbol versi gelap di latar terang (dan sebaliknya).
- Memberi bayangan, outline, atau efek pada logo.
- Menaruh logo di atas foto yang ramai tanpa panel pelindung.

## Warna

### Warna inti

| Peran | Token | Hex | Catatan |
| --- | --- | --- | --- |
| Teks utama | `--ink` | `#10224F` | Semua judul dan angka |
| Teks sekunder | `--ink-2` | `#1C2F5C` | Label, isi kartu |
| Teks redup | `--muted` | `#6B7590` | Paragraf pendukung |
| Teks paling redup | `--muted-2` | `#8792A8` | Caption, metadata |

Navy dipakai untuk **semua** teks. Tidak ada teks hitam murni di produk Altora —
hitam terasa kaku dan tidak nyambung dengan gradien latar.

### Warna aksi

| Peran | Token | Hex | Dipakai untuk |
| --- | --- | --- | --- |
| Hijau utama | `--green` | `#0E7A57` | Tombol aksi utama, angka positif |
| Hijau terang | `--green-2` | `#12A374` | Ikon status, indikator naik |
| Hijau lembut | `--green-soft` | `#E4F5EE` | Latar badge sukses |
| Ungu utama | `--purple` | `#7C5CE8` | Aksen merek, tombol sekunder |
| Ungu terang | `--purple-2` | `#A855F7` | Aksen dekoratif |
| Magenta | `--magenta` | `#C05BC8` | Ujung gradien judul |
| Ungu lembut | `--purple-soft` | `#EEE9FD` | Latar ikon dan badge |

**Hijau untuk aksi, ungu untuk identitas.** Tombol "Mulai Gratis" hijau karena
itu langkah yang diinginkan; ungu menandai wilayah merek — eyebrow, gradien
judul, badge Populer. Jangan tukar peran keduanya.

Gradien judul selalu `linear-gradient(96deg, #7C5CE8, #C05BC8)` dengan
`background-clip: text`, dan hanya untuk sebagian frasa — bukan seluruh judul.

### Warna modul

Tiap produk punya satu warna. Ini identitas, bukan dekorasi: warna yang sama
dipakai untuk ikon, aksen kartu, dan status hover di seluruh permukaan.

| Modul | Hex |
| --- | --- |
| Resto | `#7C5CE8` |
| Market | `#12A374` |
| Supermarket | `#3B82F6` |
| Laundry | `#22B8CF` |
| Counter | `#EC5B9E` |
| Jasa | `#F59E0B` |
| Pabrik | `#3E4E7E` |
| Company | `#14B8A6` |

Daftar produk yang benar-benar berjalan ada di katalog
`packages/core/src/product-catalog.js`. Warna di atas mencakup modul yang sudah
dipasarkan di landing; tambahkan entri baru di sini saat produknya nyata.

### Warna status

`--red #EF4444` untuk peringatan (stok menipis, gagal). `--amber #F59E0B` untuk
perhatian. Hijau untuk sehat. Jangan pakai warna modul untuk status — pengguna
akan salah membaca warna Laundry sebagai "informasi".

### Latar

Latar Altora adalah gradien terang lilac → merah muda → persik, bukan putih
polos:

```css
linear-gradient(150deg, #EFE7FB 0%, #F6EAF6 32%, #FBEDEE 60%, #FDF2E9 82%, #FFFDFB 100%)
```

Aturan yang mudah dilanggar: **warna akhir satu section harus sama persis dengan
warna awal section berikutnya**, kalau tidak sambungannya terlihat sebagai pita
keras. Hero memakai gradien diagonal yang berakhir hangat, jadi ia butuh fade
230px ke `#EEE8FA` agar menyatu dengan section berikutnya.

Kartu selalu putih murni `#FFFFFF` di atas gradien itu. Kontras kartu-terhadap-
latar inilah yang memberi kedalaman, bukan garis tepi.

## Tipografi

| Peran | Font | Dipakai untuk |
| --- | --- | --- |
| Utama | **Plus Jakarta Sans** | Judul, isi, tombol |
| Mono | **JetBrains Mono** | Angka, eyebrow, subdomain, kode |

Monospace bukan hiasan. Ia dipakai supaya angka **rata secara vertikal** saat
dibandingkan — Rp2,1jt di atas Rp3,4jt harus sejajar digitnya. Setiap angka
yang bisa dibandingkan pakai `--mono`.

Eyebrow juga monospace: kapital, `letter-spacing: .19em`, ukuran `.72rem`,
diawali titik bulat 8px. Ini penanda section yang konsisten di seluruh produk.

### Skala

| Elemen | Ukuran | Line-height | Tracking | Weight |
| --- | --- | --- | --- | --- |
| `h1` | `clamp(2.6rem, 5.4vw, 4.15rem)` | 1.06 | -.035em | 800 |
| `h2` | `clamp(1.9rem, 3.5vw, 2.85rem)` | 1.16 | -.03em | 800 |
| `h3` | `1.06rem` | 1.35 | -.015em | 700 |
| `.lead` | `1.02rem` | 1.65 | — | 400 |

Judul besar selalu bertracking negatif. Tanpa itu huruf terlihat renggang dan
kehilangan bobot.

Paragraf dibatasi `max-width: 56ch`. Baris yang lebih panjang dari itu membuat
mata kehilangan barisnya saat kembali ke kiri.

## Fotografi dan maskot

Altora memakai foto orang Indonesia sungguhan, bukan ilustrasi. Maskotnya
adalah tim Altora: berkaos polo putih, latar studio putih, ekspresi ramah dan
tidak dibuat-buat.

Aturan teknis yang wajib:

- **Foto harus punya alpha channel.** Jangan pernah memakai
  `mix-blend-mode: multiply` untuk menghapus latar putih. Pakaian putih di atas
  kartu putih akan hilang, dan `opacity`/`transform` pada elemen induk
  membentuk stacking context yang membuat blend tidak sampai ke latar.
- Simpan sebagai WebP, di-crop ke area terlihat.
- Foto potongan setengah badan diberi mask fade di garis potongnya, supaya
  tidak terbaca sebagai irisan.

Penempatan: orang selalu di sisi kanan atau tengah komposisi, tidak pernah
menutupi angka di dashboard. Kartu melayang boleh menimpa badan, tapi **tidak
boleh menutupi wajah**.

Di layar sempit (≤1000px) kartu melayang disembunyikan, bukan diperkecil.
Tiga kartu selebar 212px di dalam stage 360px akan mengubur maskotnya.

## Nada bicara

Bahasa Indonesia sehari-hari, sapaan "Anda", tanpa istilah teknis yang tidak
perlu.

| Tulis | Jangan |
| --- | --- |
| "Stok tetap terkendali" | "Inventory management yang optimal" |
| "Jualan lancar" | "Tingkatkan revenue Anda" |
| "Perlu restock" | "Reorder point tercapai" |
| "Semua di Starter" | "Semua di Starter, plus:" |

Judul menyatakan hasil, bukan fitur. "Jualan lancar, stok tetap terkendali"
menjual ketenangan; "Sistem POS terintegrasi" menjual perangkat lunak.

Klaim harus bisa dipertanggungjawabkan. Jangan menulis fitur yang belum ada —
FAQ tentang mode offline, misalnya, hanya boleh ditulis kalau fiturnya nyata.

Angka ditulis dengan format Indonesia: `10.000+`, `Rp2,1jt`, `99,9%`. Gunakan
`toLocaleString('id-ID')`, bukan format Inggris.
