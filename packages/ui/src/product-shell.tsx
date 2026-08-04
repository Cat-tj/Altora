"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";

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

const roleLabels: Record<ShellRole, string> = {
  OWNER: "Pemilik",
  MANAGER: "Manajer",
  STAFF: "Staf",
};

/**
 * Kerangka aplikasi bersama: sidebar collapsible (ikon + label), topbar,
 * dan navigasi mobile. Navigasi masuk sebagai data sehingga menambah
 * produk baru tidak pernah mengubah kode bersama.
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
  const [collapsed, setCollapsed] = useState(false);

  // Preferensi collapse lintas sesi
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem("shell.sidebar.collapsed");
      if (saved === "1") setCollapsed(true);
    } catch {
      /* ignore */
    }
  }, []);
  useEffect(() => {
    try {
      window.localStorage.setItem("shell.sidebar.collapsed", collapsed ? "1" : "0");
    } catch {
      /* ignore */
    }
  }, [collapsed]);

  const groups = nav
    .map((group) => ({ ...group, items: group.items.filter((item) => item.roles.includes(role)) }))
    .filter((group) => group.items.length > 0);

  const isActive = (item: ShellNavItem) =>
    pathname === item.href || (!item.exact && pathname.startsWith(`${item.href}/`));

  /* Nav mobile memuat lima tujuan tersering; sisanya tetap lewat sidebar
     pada layar yang lebih lebar. */
  const mobileItems = groups.flatMap((group) => group.items).slice(0, 5);

  return (
    <div className={`shell ${collapsed ? "is-collapsed" : ""}`}>
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

        <nav aria-label={`Menu ${productName}`} className="shell-nav">
          {groups.map((group) => (
            <section className="shell-group" key={group.label}>
              <h2>{group.label}</h2>
              {group.items.map((item) => (
                <Link
                  aria-current={isActive(item) ? "page" : undefined}
                  className={isActive(item) ? "is-active" : undefined}
                  href={item.href}
                  key={item.href}
                  title={collapsed ? item.label : undefined}
                >
                  {item.icon && <span className="shell-nav-icon" aria-hidden="true">{item.icon}</span>}
                  <span className="shell-nav-text">{item.label}</span>
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

        <button
          type="button"
          className="shell-collapse"
          onClick={() => setCollapsed((v) => !v)}
          aria-label={collapsed ? "Perluas sidebar" : "Ciutkan sidebar"}
          title={collapsed ? "Perluas" : "Ciutkan"}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            {collapsed ? <path d="m9 6 6 6-6 6" /> : <path d="m15 6-6 6 6 6" />}
          </svg>
        </button>
      </aside>

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
