# UI/UX Guide Altora

Aturan layout, komponen, gerak, dan aksesibilitas. Untuk logo, warna, dan nada
bicara lihat [Brand Guide](./BRAND-GUIDE.md).

Dokumen ini menurunkan keputusan yang sudah terbukti di `apps/landing`. Saat
memindahkannya ke `packages/ui`, jaga nilainya tetap sama supaya semua produk
terasa satu keluarga.

## Design token

Semua nilai hidup sebagai CSS custom property di `:root`. Jangan menulis hex
atau radius langsung di komponen — kalau butuh nilai baru, tambahkan tokennya.

### Radius

| Token | Nilai | Dipakai untuk |
| --- | --- | --- |
| `--r-sm` | `12px` | Badge, chip kecil |
| `--r` | `18px` | Input, item daftar |
| `--r-lg` | `26px` | Kartu |
| `--r-xl` | `34px` | Panel besar, modal |
| — | `999px` | Tombol dan pill (selalu penuh) |

Radius naik seiring ukuran elemen. Kartu 26px dengan ikon 14px di dalamnya
terasa benar; kalau keduanya sama, kartunya terlihat kaku.

### Bayangan

| Token | Nilai |
| --- | --- |
| `--sh-sm` | `0 2px 8px rgba(28,26,60,.05)` |
| `--sh` | `0 10px 30px -12px rgba(38,32,84,.16)` |
| `--sh-lg` | `0 30px 70px -30px rgba(38,32,84,.30)` |

Bayangan berwarna navy, bukan hitam, dan selalu punya offset-Y positif dengan
blur besar serta spread negatif. Ini yang membuat kartu tampak melayang lembut,
bukan ditempel.

Tingkatan bayangan menyatakan **kedekatan dengan pengguna**: `--sh-sm` untuk
kartu diam, `--sh` saat hover, `--sh-lg` untuk elemen yang benar-benar melayang
(modal, jendela dashboard).

### Garis

`--line #E9E6F2` untuk pembatas yang terlihat, `--line-2 #F1EEF8` untuk
pembatas dalam kartu. Keduanya ungu keabuan, bukan abu netral — garis abu murni
terlihat kotor di atas latar lilac.

## Layout

Lebar konten `min(100% - 40px, 1240px)`. Di bawah 720px marginnya turun jadi
32px.

Padding vertikal section: `clamp(48px, 5.6vw, 80px)`. Nilai ini pernah
`clamp(64px, 8vw, 112px)` dan menghasilkan 224px ruang kosong antar section di
layar lebar — terlalu renggang, halaman terasa terputus-putus.

### Kolom

Grid tiga kolom untuk section perbandingan (masalah → maskot → solusi), dua
kolom untuk header section (judul → pendukung), empat kolom untuk katalog.

Selalu pakai `minmax(0, Nfr)`, bukan `Nfr` saja. Tanpa `minmax(0, …)` konten
panjang memaksa kolom melebar dan merusak grid.

### Breakpoint

| Lebar | Yang berubah |
| --- | --- |
| ≤1340px | Elemen melayang ditarik masuk; margin halaman menyempit |
| ≤1180px | Katalog 4 → 3 kolom, paket 4 → 2 kolom |
| ≤1000px | Nav jadi burger, semua grid 2 kolom, elemen melayang hero disembunyikan |
| ≤720px | Semua jadi satu kolom |
| ≤620px | Modal satu kolom, tombol mengambang mengecil |

Breakpoint 1340px ada karena alasan konkret: di bawah itu margin halaman lebih
tipis daripada offset kartu melayang hero, sehingga dokumen jadi lebih lebar
dari viewport. Verifikasi dengan `document.documentElement.scrollWidth <=
innerWidth` di setiap breakpoint.

## Komponen

### Tombol

Selalu `border-radius: 999px`, `font-weight: 700`, dan naik 2px saat hover.

| Varian | Latar | Dipakai untuk |
| --- | --- | --- |
| `btn-green` | `--green` | Aksi utama |
| `btn-purple` | gradien ungu | Aksi merek (kontak, demo) |
| `btn-white` | putih + border | Aksi sekunder |
| `btn-outline` | putih + border ungu | Sekunder di area ungu |

Satu tombol hijau per layar. Kalau ada dua, tidak ada yang utama.

Bayangan tombol berwarna sesuai latarnya
(`0 10px 22px -10px rgba(14,122,87,.75)`), bukan abu — ini yang membuatnya
terasa menyala, bukan berat.

### Kartu

Putih, `--r-lg`, border `--line-2`, bayangan `--sh-sm`. Saat hover: naik 5px,
bayangan ke `--sh-lg`, border menuju warna aksen.

Kartu yang bisa diklik harus berupa `<a>` yang membungkus seluruh isi, bukan
`<div>` dengan handler. Ini yang membuat klik-kanan, buka-di-tab-baru, dan
navigasi keyboard bekerja tanpa kode tambahan.

`:focus-visible` mendapat perlakuan yang sama dengan `:hover`, ditambah ring
`0 0 0 3px` warna aksen 22%.

### Kartu melayang

Kartu kecil dengan ikon, judul, dan keterangan yang mengambang di atas
komposisi. Lebar maksimum 212px, `backdrop-filter: blur(10px)`, bayangan
`0 18px 40px -20px`.

Dua aturan yang mahal kalau dilanggar:

1. **Jangan pernah menutupi wajah** maskot atau angka pada dashboard.
2. Di bawah 1000px, **sembunyikan** — jangan diperkecil.

### Modal

Panel putih `--r-xl` di atas veil `rgba(24,20,52,.42)` dengan blur 4px. Masuk
dari `translateY(14px) scale(.98)` selama 280ms.

Wajib:

- `role="dialog"`, `aria-modal="true"`, `aria-labelledby`
- Esc menutup
- Fokus terkunci di dalam, dan kembali ke elemen pemicu saat ditutup
- `body { overflow: hidden }` **plus** kompensasi lebar scrollbar
  (`padding-right`), kalau tidak layout bergeser saat modal dibuka

Modal yang menggantikan halaman harus tetap berangkat dari `<a href>` asli.
Handler membatalkan klik biasa saja — klik dengan Cmd/Ctrl/Shift dibiarkan
lewat, sehingga buka-di-tab-baru tetap jalan dan halamannya tetap bisa
di-bookmark.

### Akordeon

`<summary>` dengan `role="button"`, `tabindex="0"`, dan `aria-expanded` yang
diperbarui. Tinggi dianimasikan dari `scrollHeight` ke `0` lalu dikembalikan ke
`auto` setelah transisi — memakai `auto` langsung membuat transisi tidak jalan.

Dukung Enter dan Spasi, bukan klik saja.

### Input

Tinggi 52px, radius penuh, border `--line`. Saat fokus: border menuju ungu
muda plus ring `0 0 0 4px rgba(124,92,232,.12)`.

Kolom pencarian harus mencari lebih dari sekadar judul. Filter modul di halaman
masuk mencocokkan nama, deskripsi, **dan** daftar fitur — mengetik "cabang"
memunculkan Supermarket dan Company, yang tidak akan ditemukan kalau hanya
namanya yang dicari.

Sediakan state kosong dengan jalan keluar, bukan sekadar "tidak ditemukan".

### Ikon

SVG sprite inline, `viewBox="0 0 24 24"`, stroke 1.8, ujung dan sambungan
membulat. Ikon berbentuk garis, bukan solid — kecuali logo merek (WhatsApp,
media sosial) yang memang harus solid.

Ikon selalu duduk di dalam kotak berwarna: 44px radius 14px untuk ukuran
normal, 36px radius 11px untuk kecil. Latar kotaknya versi lembut dari warna
ikonnya.

## Gerak

| Keperluan | Durasi | Easing |
| --- | --- | --- |
| Hover, fokus | 220–300ms | `cubic-bezier(.22,1,.36,1)` |
| Masuk/keluar panel | 280–380ms | `cubic-bezier(.22,1,.36,1)` |
| Tinggi akordeon | 350ms | `cubic-bezier(.4,0,.2,1)` |
| Melayang idle | 7–11s | `ease-in-out`, tak terbatas |

`cubic-bezier(.22,1,.36,1)` adalah easing utama Altora — cepat di awal, mendarat
lembut. Jangan memakai `ease` bawaan; ia terasa lamban di awal dan tiba-tiba di
akhir.

Reveal saat scroll: `opacity 0 → 1`, `translateY(22px) → 0`, dipicu
IntersectionObserver dengan `threshold: 0.08`. Jeda bertingkat 80ms per elemen,
maksimum empat tingkat.

Animasi idle (kartu melayang, tanda tanya) harus punya durasi dan jeda yang
berbeda-beda. Kalau serempak, mereka terlihat seperti satu blok yang bergerak,
bukan elemen yang hidup sendiri-sendiri.

### Yang harus dihindari

- Pulsing atau bounce pada elemen yang tidak diklik — mengganggu, bukan menarik.
- Menganimasikan `width`/`height`/`top`/`left`. Pakai `transform` dan `opacity`.
- Lupa `@media (prefers-reduced-motion: reduce)`. Setiap animasi wajib punya
  jalan keluarnya.

## Aksesibilitas

Yang tidak bisa ditawar:

- Semua yang bisa diklik punya `:focus-visible` yang terlihat jelas.
- Elemen interaktif berupa `<a>` atau `<button>` sungguhan.
- Gambar dekoratif memakai `aria-hidden="true"` dan `alt=""`; gambar bermakna
  memakai alt yang deskriptif.
- Kontras teks minimal 4.5:1. `--muted #6B7590` di atas putih lolos; jangan
  memakainya di atas panel berwarna tanpa mengecek ulang.
- Tautan yang membuka tab baru memakai `rel="noopener"` dan `aria-label` yang
  menjelaskan tujuannya.
- Halaman tidak boleh menggeser horizontal di lebar mana pun.

## Pola khusus Altora

### Dashboard sebagai bukti

Tampilan dashboard di materi pemasaran **dibangun dengan HTML/CSS**, bukan
screenshot. Alasannya: tetap tajam di layar retina, bisa diterjemahkan, ukuran
berkasnya kecil, dan angkanya bisa diperbarui tanpa membuka alat desain.

Isinya harus masuk akal: 88 transaksi dengan omzet Rp2,1jt berarti rata-rata
Rp24 ribu per transaksi — wajar untuk minimarket. Angka yang tidak masuk akal
merusak kepercayaan lebih cepat daripada desain yang jelek.

### Satu daftar produk

Nama, subdomain, warna, dan deskripsi modul hidup di satu berkas data yang
dibaca semua permukaan. Landing dan halaman masuk memakai sumber yang sama;
menambah produk cukup satu tempat.

Katalog produk yang berjalan ada di `packages/core/src/product-catalog.js`.
Jangan menduplikasi daftar itu di komponen.

### Alur masuk

Tiap produk berjalan di subdomainnya sendiri dan melayani `/login` — tidak ada
landing pemasaran per produk (lihat
[batas produk](../architecture/PRODUCT-BOUNDARIES.md)). Karena satu pemilik bisa
berlangganan beberapa modul tapi masuk ke masing-masing modul secara terpisah,
titik masuknya adalah **pemilih modul**, bukan form kredensial.

Pemilih itu tampil sebagai halaman tersendiri yang bisa di-bookmark, dan sebagai
modal saat dibuka dari landing.
