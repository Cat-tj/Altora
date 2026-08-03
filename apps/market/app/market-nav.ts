import type { ShellNavGroup } from "@altora/ui/product-shell";

/**
 * Navigasi Altora Market lengkap.
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
      { href: "/retur", label: "Retur", roles: ["OWNER", "MANAGER"] },
    ],
  },
  {
    label: "Produk & stok",
    items: [
      { href: "/produk", label: "Produk & Stok", roles: ["OWNER", "MANAGER"] },
      { href: "/produk/transfer", label: "Transfer Stok", roles: ["OWNER", "MANAGER"] },
      { href: "/penerimaan", label: "Penerimaan Barang", roles: ["OWNER", "MANAGER"] },
      { href: "/opname", label: "Stock Opname", roles: ["OWNER", "MANAGER"] },
    ],
  },
  {
    label: "Keuangan",
    items: [
      { href: "/laporan", label: "Laporan & Profit", roles: ["OWNER", "MANAGER"] },
      { href: "/pengeluaran", label: "Pengeluaran Operasional", roles: ["OWNER", "MANAGER"] },
    ],
  },
  {
    label: "Pelanggan & Promo",
    items: [
      { href: "/member", label: "Member & Poin", roles: ["OWNER", "MANAGER", "STAFF"] },
      { href: "/promo", label: "Promo & Diskon", roles: ["OWNER", "MANAGER"] },
      { href: "/voucher", label: "Voucher & Gift Card", roles: ["OWNER", "MANAGER"] },
    ],
  },
  {
    label: "SDM & Kehadiran",
    items: [
      { href: "/absensi", label: "Absensi Staf", roles: ["OWNER", "MANAGER", "STAFF"] },
      { href: "/audit-log", label: "Log Audit", roles: ["OWNER"] },
    ],
  },
];
