"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import type { ShellNavGroup, ShellRole } from "./product-shell";

const roleLabels: Record<ShellRole, string> = {
  OWNER: "Pemilik",
  MANAGER: "Manajer",
  STAFF: "Staf",
};

/**
 * Sidebar tunggal untuk SEMUA produk (Market, Resto, dll).
 *
 * Aturan: tidak ada sidebar kedua di mana pun. Halaman POS dan halaman
 * kelola memakai komponen ini lewat shell masing-masing, sehingga pindah
 * halaman tidak pernah mengganti tampilan navigasi.
 *
 * - Tanpa brand header (logo cukup di topbar) — konsisten di semua halaman.
 * - Collapsible dengan preferensi tersimpan di localStorage.
 * - Ikon + label; saat collapse hanya ikon dengan tooltip.
 */
export function AppSidebar({
  nav,
  userName,
  role,
  onSignOut,
}: {
  nav: ShellNavGroup[];
  userName: string;
  role: ShellRole;
  onSignOut: () => void;
}) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

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

  const isActive = (href: string, exact?: boolean) =>
    pathname === href || (!exact && pathname.startsWith(`${href}/`));

  return (
    <aside className={`shell-side ${collapsed ? "is-collapsed" : ""}`} aria-label="Navigasi utama">
      <nav aria-label="Menu utama" className="shell-nav">
        {groups.map((group) => (
          <section className="shell-group" key={group.label}>
            <h2>{group.label}</h2>
            {group.items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive(item.href, item.exact) ? "page" : undefined}
                className={isActive(item.href, item.exact) ? "is-active" : undefined}
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
  );
}
