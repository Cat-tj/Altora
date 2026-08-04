"use client";

import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { AppSidebar } from "./app-sidebar";
import { AppDrawer } from "./app-drawer";

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
 * Kerangka aplikasi bersama untuk halaman kelola (non-POS):
 * satu sidebar (AppSidebar) di desktop, satu drawer (AppDrawer) di mobile —
 * komponen navigasi SAMA dengan mode kasir, tidak ada bottom-nav.
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
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="shell">
      <a className="shell-skip" href="#shell-main">
        Lewati navigasi
      </a>

      <AppSidebar nav={nav} userName={userName} role={role} onSignOut={onSignOut} />

      <div className="shell-main" id="shell-main">
        <header className="shell-topbar">
          <div className="shell-topbar-left">
            <button
              type="button"
              className="shell-menu-btn"
              aria-label="Buka menu navigasi"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((v) => !v)}
            >
              <span /><span /><span />
            </button>
            <span className="shell-topbar-mark" aria-hidden="true">A</span>
            <span className="shell-topbar-title">
              {productName} · {tenantNoun} {tenantName}
            </span>
          </div>
          <button className="shell-topbar-signout" onClick={onSignOut} type="button">
            Keluar
          </button>
        </header>
        {children}
      </div>

      <AppDrawer
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        nav={nav}
        userName={userName}
        role={role}
        onSignOut={onSignOut}
        productName={productName}
      />
    </div>
  );
}
