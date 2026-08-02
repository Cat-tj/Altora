import type { ShellNavGroup } from "@altora/ui/product-shell";

/**
 * Navigasi Altora Market.
 *
 * Kerangkanya milik `@altora/ui`; daftar ini milik Market. Menambah halaman
 * cukup menambah entri di sini — tidak ada kode bersama yang perlu diubah.
 */
export const marketNav: ShellNavGroup[] = [
  {
    label: "Beranda",
    items: [{ href: "/simple/hari-ini", label: "Hari Ini", roles: ["OWNER", "MANAGER"] }],
  },
  {
    label: "Penjualan",
    items: [
      { href: "/kasir", label: "Kasir", roles: ["OWNER", "MANAGER", "STAFF"], exact: true },
      { href: "/kasir/riwayat", label: "Transaksi", roles: ["OWNER", "MANAGER", "STAFF"] },
    ],
  },
  {
    label: "Produk & stok",
    items: [{ href: "/produk", label: "Produk & Stok", roles: ["OWNER", "MANAGER"] }],
  },
];
