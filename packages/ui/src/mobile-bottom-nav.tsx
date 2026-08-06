"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ShellNavGroup, ShellRole } from "./app-shell";

/**
 * Bottom navigation untuk mobile — 4 shortcut utama + "Lainnya" (drawer).
 *
 * Fixed di bawah viewport, hormati safe-area-inset-bottom.
 * Target sentuh minimal 44×44px.
 */
export function MobileBottomNav({
  nav,
  role,
  onMoreClick,
}: {
  nav: ShellNavGroup[];
  role: ShellRole;
  onMoreClick: () => void;
}) {
  const pathname = usePathname();

  // Flatten nav & filter by role
  const allItems = nav
    .flatMap((g) => g.items)
    .filter((i) => i.roles.includes(role));

  // 4 shortcut utama: Hari Ini, Kasir, Produk, Transaksi
  const shortcuts = [
    allItems.find((i) => i.href === "/simple/hari-ini"),
    allItems.find((i) => i.href === "/kasir"),
    allItems.find((i) => i.href === "/produk"),
    allItems.find((i) => i.href === "/kasir/riwayat"),
  ].filter(Boolean) as typeof allItems;

  const isActive = (href: string, exact?: boolean) =>
    pathname === href || (!exact && pathname.startsWith(`${href}/`));

  return (
    <nav className="mobile-bottom-nav" aria-label="Navigasi cepat">
      {shortcuts.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={`mobile-bottom-nav-item ${isActive(item.href, item.exact) ? "is-active" : ""}`}
          aria-current={isActive(item.href, item.exact) ? "page" : undefined}
        >
          <span className="mobile-bottom-nav-icon" aria-hidden="true">
            {item.icon}
          </span>
          <span className="mobile-bottom-nav-label">{item.label}</span>
        </Link>
      ))}
      <button
        type="button"
        className="mobile-bottom-nav-item"
        onClick={onMoreClick}
        aria-label="Buka menu lengkap"
      >
        <span className="mobile-bottom-nav-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
            <circle cx="12" cy="5" r="1.5" />
            <circle cx="12" cy="12" r="1.5" />
            <circle cx="12" cy="19" r="1.5" />
          </svg>
        </span>
        <span className="mobile-bottom-nav-label">Lainnya</span>
      </button>
    </nav>
  );
}
