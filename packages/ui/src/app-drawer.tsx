"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import type { ShellNavGroup, ShellRole } from "./product-shell";

const roleLabels: Record<ShellRole, string> = {
  OWNER: "Pemilik",
  MANAGER: "Manajer",
  STAFF: "Staf",
};

/**
 * Drawer navigasi MOBILE — satu-satunya navigasi mobile di semua produk.
 *
 * Dipakai oleh PosShell dan ProductShell: hamburger di topbar membuka
 * drawer dari kiri (backdrop blur, ESC/backdrop menutup). Tidak ada
 * bottom-nav lagi — pindah halaman tidak pernah mengganti gaya navigasi.
 */
export function AppDrawer({
  open,
  onClose,
  nav,
  userName,
  role,
  onSignOut,
  productName,
}: {
  open: boolean;
  onClose: () => void;
  nav: ShellNavGroup[];
  userName: string;
  role: ShellRole;
  onSignOut: () => void;
  productName: string;
}) {
  const pathname = usePathname();

  // Tutup otomatis saat pindah halaman
  useEffect(() => onClose(), [pathname, onClose]);

  // ESC menutup
  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [open, onClose]);

  if (!open) return null;

  const groups = nav
    .map((group) => ({ ...group, items: group.items.filter((item) => item.roles.includes(role)) }))
    .filter((group) => group.items.length > 0);

  const isActive = (href: string, exact?: boolean) =>
    pathname === href || (!exact && pathname.startsWith(`${href}/`));

  return (
    <div className="app-drawer-layer">
      <div className="app-drawer-backdrop" onClick={onClose} aria-hidden="true" />
      <nav className="app-drawer" aria-label={`Navigasi ${productName} (mobile)`}>
        <div className="app-drawer-head">
          <span className="app-drawer-mark" aria-hidden="true">A</span>
          <div>
            <strong>{productName}</strong>
            <span className="app-drawer-user">
              {userName} · {roleLabels[role]}
            </span>
          </div>
          <button type="button" className="app-drawer-close" onClick={onClose} aria-label="Tutup menu">
            ✕
          </button>
        </div>
        <div className="app-drawer-groups">
          {groups.map((group) => (
            <section key={group.label} className="app-drawer-group">
              <p className="app-drawer-label">{group.label}</p>
              {group.items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`app-drawer-link ${isActive(item.href, item.exact) ? "is-active" : ""}`}
                >
                  {item.icon && <span className="app-drawer-icon" aria-hidden="true">{item.icon}</span>}
                  <span>{item.label}</span>
                </Link>
              ))}
            </section>
          ))}
        </div>
        <div className="app-drawer-foot">
          <button type="button" className="app-drawer-signout" onClick={onSignOut}>
            Keluar
          </button>
        </div>
      </nav>
    </div>
  );
}
