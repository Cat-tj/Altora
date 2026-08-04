import type { ShellNavGroup } from "@altora/ui/product-shell";
import { NAV_ICONS } from "@altora/ui/nav-icons";

/**
 * Navigasi Altora Market lengkap.
 * Ikon dari NAV_ICONS (shared) — sidebar, drawer POS, dan bottom-nav
 * memakai data ini supaya tidak ada duplikasi menu.
 */
export const marketNav: ShellNavGroup[] = [
  {
    label: "Beranda",
    items: [{ href: "/simple/hari-ini", label: "Hari Ini", roles: ["OWNER", "MANAGER"], icon: NAV_ICONS.dashboard }],
  },
  {
    label: "Penjualan",
    items: [
      { href: "/kasir", label: "Kasir", roles: ["OWNER", "MANAGER", "STAFF"], exact: true, icon: NAV_ICONS.kasir },
      { href: "/kasir/riwayat", label: "Transaksi", roles: ["OWNER", "MANAGER", "STAFF"], icon: NAV_ICONS.transaksi },
      { href: "/retur", label: "Retur", roles: ["OWNER", "MANAGER"], icon: NAV_ICONS.retur },
    ],
  },
  {
    label: "Produk & stok",
    items: [
      { href: "/produk", label: "Produk & Stok", roles: ["OWNER", "MANAGER"], icon: NAV_ICONS.produk },
      { href: "/produk/transfer", label: "Transfer Stok", roles: ["OWNER", "MANAGER"], icon: NAV_ICONS.transfer },
      { href: "/penerimaan", label: "Penerimaan Barang", roles: ["OWNER", "MANAGER"], icon: NAV_ICONS.penerimaan },
      { href: "/opname", label: "Stock Opname", roles: ["OWNER", "MANAGER"], icon: NAV_ICONS.opname },
    ],
  },
  {
    label: "Keuangan",
    items: [
      { href: "/laporan", label: "Laporan & Profit", roles: ["OWNER", "MANAGER"], icon: NAV_ICONS.laporan },
      { href: "/pengeluaran", label: "Pengeluaran Operasional", roles: ["OWNER", "MANAGER"], icon: NAV_ICONS.pengeluaran },
    ],
  },
  {
    label: "Pelanggan & Promo",
    items: [
      { href: "/member", label: "Member & Poin", roles: ["OWNER", "MANAGER", "STAFF"], icon: NAV_ICONS.member },
      { href: "/promo", label: "Promo & Diskon", roles: ["OWNER", "MANAGER"], icon: NAV_ICONS.promo },
      { href: "/voucher", label: "Voucher & Gift Card", roles: ["OWNER", "MANAGER"], icon: NAV_ICONS.voucher },
    ],
  },
  {
    label: "Pengaturan & SDM",
    items: [
      { href: "/pengaturan", label: "Pengaturan Toko", roles: ["OWNER", "MANAGER"], icon: NAV_ICONS.pengaturan },
      { href: "/absensi", label: "Absensi Staf", roles: ["OWNER", "MANAGER", "STAFF"], icon: NAV_ICONS.absensi },
      { href: "/audit-log", label: "Log Audit", roles: ["OWNER"], icon: NAV_ICONS.audit },
    ],
  },
];
