"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { type ReactNode } from "react";
import { AppSidebar } from "./app-sidebar";

export type ShellRole = "OWNER" | "MANAGER" | "STAFF";

export type ShellNavItem = {
  href: string;
  label: string;
  roles: ShellRole[];
  /** Rute yang cocok persis saja, mis. `/kasir` yang punya anak sendiri. */
  exact?: boolean;
  /** Ikon inline (SVG) — opsional, dipakai sidebar & drawer mobile. */
  icon?: ReactNode;
};

export type ShellNavGroup = {
  label: string;
  items: ShellNavItem[];
};

export type ProductShellProps = {
  children: ReactNode;
  /** Nama produk untuk label navigasi, mis. "Altora Market". */
  productName: string;
  /** Sebutan tenant di produk ini, mis. "Toko" atau "Resto". */
  tenantNoun: string;
  nav: ShellNavGroup[];
  tenantName: string;
  userName: string;
  role: ShellRole;
  onSignOut: () => void;
};

/**
 * Kerangka aplikasi bersama: satu sidebar (AppSidebar), topbar, dan
 * navigasi mobile. Navigasi masuk sebagai data sehingga menambah produk
 * baru tidak pernah mengubah kode bersama.
 */
export function ProductShell({
  children,
  productName,
  tenantNoun,
  nav,
  tenantName,
  userName,
  role,
  onSignOut,
}: ProductShellProps) {
  const pathname = usePathname();

  /* Nav mobile memuat lima tujuan tersering; sisanya tetap lewat sidebar
     pada layar yang lebih lebar. */
  const groups = nav
    .map((group) => ({ ...group, items: group.items.filter((item) => item.roles.includes(role)) }))
    .filter((group) => group.items.length > 0);
  const mobileItems = groups.flatMap((group) => group.items).slice(0, 5);

  const isActive = (item: ShellNavItem) =>
    pathname === item.href || (!item.exact && pathname.startsWith(`${item.href}/`));

  return (
    <div className="shell">
      <a className="shell-skip" href="#shell-main">
        Lewati navigasi
      </a>

      <AppSidebar nav={nav} userName={userName} role={role} onSignOut={onSignOut} />

      <div className="shell-main" id="shell-main">
        <header className="shell-topbar">
          <span className="shell-topbar-title">
            {productName} · {tenantNoun} {tenantName}
          </span>
          <button className="shell-topbar-signout" onClick={onSignOut} type="button">
            Keluar
          </button>
        </header>
        {children}
      </div>

      <nav className="shell-bottom-nav" aria-label="Navigasi utama (mobile)">
        {mobileItems.map((item) => (
          <Link
            aria-current={isActive(item) ? "page" : undefined}
            className={isActive(item) ? "is-active" : undefined}
            href={item.href}
            key={item.href}
          >
            {item.icon && <span className="shell-nav-icon" aria-hidden="true">{item.icon}</span>}
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
