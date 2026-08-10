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
}: {
  nav: ShellNavGroup[];
  role: ShellRole;
}) {
  const pathname = usePathname();

  // Flatten nav & filter by role
  const allItems = nav
    .flatMap((g) => g.items)
    .filter((i) => i.roles.includes(role));

  // 3 shortcut utama: Hari Ini, Kasir, Produk
  // Transaksi masuk drawer (tidak di bottom nav)
  const shortcuts = [
    allItems.find((i) => i.href === "/simple/hari-ini"),
    allItems.find((i) => i.href === "/kasir"),
    allItems.find((i) => i.href === "/produk"),
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
    </nav>
  );
}
