"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

export type ShellRole = "OWNER" | "MANAGER" | "STAFF";

export type ShellNavItem = {
  href: string;
  label: string;
  roles: ShellRole[];
  /** Rute yang cocok persis saja, mis. `/kasir` yang punya anak sendiri. */
  exact?: boolean;
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

const roleLabels: Record<ShellRole, string> = {
  OWNER: "Pemilik",
  MANAGER: "Manajer",
  STAFF: "Staf",
};

/**
 * Kerangka aplikasi bersama: sidebar, topbar, dan navigasi mobile.
 *
 * Komponen ini sengaja tidak tahu produk apa pun. Navigasi masuk sebagai
 * data dan warna lewat `--accent`, sehingga menambah produk baru tidak
 * pernah mengubah kode bersama — lihat docs/design/UI-UX-GUIDE.md.
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

  const groups = nav
    .map((group) => ({ ...group, items: group.items.filter((item) => item.roles.includes(role)) }))
    .filter((group) => group.items.length > 0);

  const isActive = (item: ShellNavItem) =>
    pathname === item.href || (!item.exact && pathname.startsWith(`${item.href}/`));

  /* Nav mobile memuat lima tujuan tersering; sisanya tetap lewat sidebar
     pada layar yang lebih lebar. */
  const mobileItems = groups.flatMap((group) => group.items).slice(0, 5);

  return (
    <div className="shell">
      <a className="shell-skip" href="#shell-main">
        Lewati navigasi
      </a>

      <aside className="shell-side" aria-label={`Navigasi ${productName}`}>
        <div className="shell-brand">
          <span className="shell-mark" aria-hidden="true" />
          <span className="shell-brand-text">
            <strong>{tenantName}</strong>
            <small>{productName}</small>
          </span>
        </div>

        <nav aria-label={`Menu ${productName}`}>
          {groups.map((group) => (
            <section className="shell-group" key={group.label}>
              <h2>{group.label}</h2>
              {group.items.map((item) => (
                <Link
                  aria-current={isActive(item) ? "page" : undefined}
                  className={isActive(item) ? "is-active" : undefined}
                  href={item.href}
                  key={item.href}
                >
                  {item.label}
                </Link>
              ))}
            </section>
          ))}
        </nav>

        <div className="shell-user">
          <span className="shell-avatar" aria-hidden="true">
            {userName.slice(0, 1).toUpperCase()}
          </span>
          <span className="shell-user-text">
            <strong>{userName}</strong>
            <small>{roleLabels[role]}</small>
          </span>
          <button className="shell-signout" onClick={onSignOut} type="button">
            Keluar
          </button>
        </div>
      </aside>

      <div className="shell-body">
        <header className="shell-top">
          <span className="shell-top-tenant">
            <strong>{tenantName}</strong>
            <small>{tenantNoun} · Outlet aktif</small>
          </span>
          <span className="shell-sync">
            <i aria-hidden="true" />
            Tersinkron
          </span>
        </header>

        <main className="shell-main" id="shell-main" tabIndex={-1}>
          {children}
        </main>
      </div>

      <nav className="shell-mobile" aria-label={`Navigasi cepat ${productName}`}>
        {mobileItems.map((item) => (
          <Link
            aria-current={isActive(item) ? "page" : undefined}
            className={isActive(item) ? "is-active" : undefined}
            href={item.href}
            key={item.href}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
