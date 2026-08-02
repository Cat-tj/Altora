import type { ShellNavGroup } from "@altora/ui/product-shell";

/**
 * Navigasi Altora Resto.
 *
 * Urutannya mengikuti alur layanan sebenarnya — meja diisi, pesanan masuk,
 * dapur mengerjakan, lalu dibayar — supaya sidebar terbaca seperti jalannya
 * shift, bukan seperti daftar tabel database.
 */
export const restoNav: ShellNavGroup[] = [
  {
    label: "Beranda",
    items: [{ href: "/hari-ini", label: "Hari Ini", roles: ["OWNER", "MANAGER"] }],
  },
  {
    label: "Layanan",
    items: [
      { href: "/meja", label: "Meja", roles: ["OWNER", "MANAGER", "STAFF"] },
      { href: "/pesanan", label: "Pesanan", roles: ["OWNER", "MANAGER", "STAFF"] },
      { href: "/dapur", label: "Dapur", roles: ["OWNER", "MANAGER", "STAFF"] },
      { href: "/pembayaran", label: "Pembayaran", roles: ["OWNER", "MANAGER", "STAFF"] },
    ],
  },
  {
    label: "Menu & stok",
    items: [
      { href: "/menu", label: "Menu & Resep", roles: ["OWNER", "MANAGER"] },
      { href: "/bahan", label: "Bahan Baku", roles: ["OWNER", "MANAGER"] },
    ],
  },
];
