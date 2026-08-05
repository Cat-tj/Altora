"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import { AppDrawer } from "./app-drawer";

/* ─── Types ─── */
export type ShellRole = "OWNER" | "MANAGER" | "STAFF";

export type ShellNavItem = {
  href: string;
  label: string;
  roles: ShellRole[];
  exact?: boolean;
  icon?: ReactNode;
};

export type ShellNavGroup = {
  label: string;
  items: ShellNavItem[];
};

const roleLabels: Record<ShellRole, string> = {
  OWNER: "Pemilik",
  MANAGER: "Manajer",
  STAFF: "Staf",
};

/* ─── AppShell ─── */
/**
 * Shell induk untuk SELURUH Altora Market (atau produk lain).
 *
 * Arsitektur:
 *   AppShell
 *   ├── Sidebar (floating, collapsible, persistent)
 *   ├── Header (brand + keluar)
 *   ├── Main / children (hanya ini yang berubah)
 *   └── Drawer (mobile, shared)
 *
 * TIDAK ada shell terpisah untuk POS vs halaman lain.
 * Pindah halaman = hanya children berubah; sidebar & header tetap.
 */
export function AppShell({
  children,
  productName,
  tenantName,
  userName,
  role,
  onSignOut,
  nav,
}: {
  children: ReactNode;
  productName: string;
  tenantName: string;
  userName: string;
  role: ShellRole;
  onSignOut: () => void;
  nav: ShellNavGroup[];
}) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  // Restore collapse state dari localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("app.sidebar.collapsed");
      if (saved === "1") setCollapsed(true);
    } catch { /* ok */ }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("app.sidebar.collapsed", collapsed ? "1" : "0");
    } catch { /* ok */ }
  }, [collapsed]);

  // Tutup drawer — stabil agar AppDrawer useEffect tidak infinite-loop
  const closeMenu = useCallback(() => setMenuOpen(false), []);

  /* Filter nav by role */
  const groups = nav
    .map((g) => ({
      ...g,
      items: g.items.filter((i) => i.roles.includes(role)),
    }))
    .filter((g) => g.items.length > 0);

  const isActive = (href: string, exact?: boolean) =>
    pathname === href || (!exact && pathname.startsWith(`${href}/`));

  return (
    <div className={`app-shell ${collapsed ? "is-collapsed" : ""}`}>
      {/* Skip link */}
      <a className="app-shell-skip" href="#app-main">Lewati navigasi</a>

      {/* Sidebar — floating, persistent, SEMUA halaman */}
      <aside className="app-shell-sidebar" aria-label="Navigasi utama">
        {/* Brand */}
        <div className="app-shell-brand">
          <span className="app-shell-mark" aria-hidden="true">A</span>
          <div className="app-shell-brand-text">
            <strong>{productName}</strong>
            <small>{tenantName}</small>
          </div>
        </div>

        {/* Nav groups */}
        <nav aria-label="Menu utama" className="app-shell-nav">
          {groups.map((group) => (
            <section className="app-shell-group" key={group.label}>
              <h2>{group.label}</h2>
              {group.items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={isActive(item.href, item.exact) ? "page" : undefined}
                  className={isActive(item.href, item.exact) ? "is-active" : undefined}
                  title={collapsed ? item.label : undefined}
                >
                  {item.icon && (
                    <span className="app-shell-nav-icon" aria-hidden="true">
                      {item.icon}
                    </span>
                  )}
                  <span className="app-shell-nav-text">{item.label}</span>
                </Link>
              ))}
            </section>
          ))}
        </nav>

        {/* User footer */}
        <div className="app-shell-user">
          <span className="app-shell-avatar" aria-hidden="true">
            {userName.slice(0, 1).toUpperCase()}
          </span>
          <span className="app-shell-user-text">
            <strong>{userName}</strong>
            <small>{roleLabels[role]}</small>
          </span>
          <button className="app-shell-signout" onClick={onSignOut} type="button">
            Keluar
          </button>
        </div>

        {/* Collapse toggle */}
        <button
          type="button"
          className="app-shell-collapse"
          onClick={() => setCollapsed((v) => !v)}
          aria-label={collapsed ? "Perluas sidebar" : "Ciutkan sidebar"}
          title={collapsed ? "Perluas" : "Ciutkan"}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            {collapsed ? <path d="m9 6 6 6-6 6" /> : <path d="m15 6-6 6 6 6" />}
          </svg>
        </button>
      </aside>

      {/* Main area */}
      <div className="app-shell-main" id="app-main">
        {/* Children — konten halaman */}
        <main className="app-shell-content">{children}</main>
      </div>

      {/* Drawer mobile — shared, SATU untuk semua halaman */}
      <AppDrawer
        open={menuOpen}
        onClose={closeMenu}
        nav={nav}
        userName={userName}
        role={role}
        onSignOut={onSignOut}
        productName={productName}
      />
    </div>
  );
}
