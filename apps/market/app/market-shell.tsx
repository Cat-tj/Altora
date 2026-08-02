"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { resolveProductLoginUrl } from "@altora/core/auth-redirect";

type Role = "OWNER" | "MANAGER" | "STAFF";
type NavigationItem = { href: string; label: string; roles: Role[] };

const groups: { label: string; items: NavigationItem[] }[] = [
  { label: "Beranda", items: [{ href: "/simple/hari-ini", label: "Beranda", roles: ["OWNER", "MANAGER"] }] },
  { label: "Penjualan", items: [{ href: "/kasir", label: "Kasir", roles: ["OWNER", "MANAGER", "STAFF"] }, { href: "/kasir/riwayat", label: "Transaksi", roles: ["OWNER", "MANAGER", "STAFF"] }, { href: "/simple/promo", label: "Promo", roles: ["OWNER", "MANAGER"] }, { href: "/member", label: "Member", roles: ["OWNER", "MANAGER", "STAFF"] }] },
  { label: "Produk & stok", items: [{ href: "/produk", label: "Produk & Stok", roles: ["OWNER", "MANAGER"] }, { href: "/stock-receipt", label: "Barang Masuk", roles: ["OWNER", "MANAGER"] }, { href: "/stock-count", label: "Penyesuaian Stok", roles: ["OWNER", "MANAGER"] }] },
  { label: "Mitra", items: [{ href: "/supplier", label: "Supplier", roles: ["OWNER", "MANAGER"] }] },
  { label: "Analisis", items: [{ href: "/laporan", label: "Laporan", roles: ["OWNER", "MANAGER"] }] },
  { label: "Sistem", items: [{ href: "/tim", label: "Tim", roles: ["OWNER", "MANAGER"] }, { href: "/pengaturan", label: "Pengaturan", roles: ["OWNER"] }] },
];

const roleLabels: Record<Role, string> = { OWNER: "Pemilik", MANAGER: "Manajer", STAFF: "Staf" };

export function MarketShell({ children, tenantName, userName, role }: { children: React.ReactNode; tenantName: string; userName: string; role: Role }) {
  const pathname = usePathname();
  const visibleGroups = groups.map((group) => ({ ...group, items: group.items.filter((item) => item.roles.includes(role)) })).filter((group) => group.items.length);
  const isActive = (href: string) => pathname === href || (href !== "/kasir" && pathname.startsWith(`${href}/`));
  const logout = () => signOut({ callbackUrl: resolveProductLoginUrl(window.location.origin, "market.altora.my.id") });
  return (
    <div className="market-auth-shell">
      <a className="market-skip-link" href="#market-main">Lewati navigasi</a>
      <aside className="market-auth-sidebar" aria-label="Navigasi Altora Market">
        <Link className="market-auth-store" href="/simple/hari-ini"><strong>{tenantName}</strong><span>Toko · Outlet aktif</span></Link>
        <nav aria-label="Menu Market">{visibleGroups.map((group) => <section className="market-auth-nav-group" key={group.label}><h2>{group.label}</h2>{group.items.map((item) => <Link aria-current={isActive(item.href) ? "page" : undefined} className={isActive(item.href) ? "is-active" : undefined} href={item.href} key={item.href}>{item.label}</Link>)}</section>)}</nav>
        <div className="market-auth-user"><strong>{userName}</strong><span>{roleLabels[role]}</span><button onClick={logout} type="button">Keluar</button></div>
      </aside>
      <div className="market-auth-content"><header className="market-auth-topbar"><div><span>{tenantName}</span><strong>Toko · Outlet aktif</strong></div><span className="market-sync">● Sinkron</span></header><main id="market-main" tabIndex={-1}>{children}</main></div>
    </div>
  );
}
