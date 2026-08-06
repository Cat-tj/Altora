"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useCallback } from "react";
import type { ShellNavGroup, ShellRole } from "./app-shell";

const roleLabels: Record<ShellRole, string> = {
  OWNER: "Pemilik",
  MANAGER: "Manajer",
  STAFF: "Staf",
};

/**
 * Drawer navigasi MOBILE — satu-satunya navigasi mobile di semua produk.
 *
 * Features:
 * - Backdrop blur + ESC menutup
 * - Focus trap (tab stays inside drawer)
 * - Body scroll lock
 * - Focus return ke hamburger setelah ditutup
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
  const drawerRef = useRef<HTMLDivElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);

  // Simpan fokus sebelumnya saat drawer dibuka
  useEffect(() => {
    if (open) {
      previousFocus.current = document.activeElement as HTMLElement;
    }
  }, [open]);

  // Tutup otomatis saat pindah halaman
  useEffect(() => onClose(), [pathname, onClose]);

  // ESC menutup
  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [open, onClose]);

  // Body scroll lock
  useEffect(() => {
    if (!open) return;
    const scrollY = window.scrollY;
    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = "100%";
    return () => {
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.width = "";
      window.scrollTo(0, scrollY);
    };
  }, [open]);

  // Focus trap
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key !== "Tab" || !drawerRef.current) return;
      const focusable = drawerRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!first || !last) return;
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    },
    []
  );

  // Focus ke drawer saat dibuka, return fokus saat ditutup
  useEffect(() => {
    if (open) {
      const timer = setTimeout(() => {
        const firstLink = drawerRef.current?.querySelector<HTMLElement>("a");
        firstLink?.focus();
      }, 50);
      return () => clearTimeout(timer);
    } else if (previousFocus.current) {
      previousFocus.current.focus();
      previousFocus.current = null;
    }
  }, [open]);

  if (!open) return null;

  const groups = nav
    .map((group) => ({ ...group, items: group.items.filter((item) => item.roles.includes(role)) }))
    .filter((group) => group.items.length > 0);

  const isActive = (href: string, exact?: boolean) =>
    pathname === href || (!exact && pathname.startsWith(`${href}/`));

  return (
    <div className="app-drawer-layer" onKeyDown={handleKeyDown}>
      <div className="app-drawer-backdrop" onClick={onClose} aria-hidden="true" />
      <nav
        ref={drawerRef}
        className="app-drawer"
        aria-label={`Navigasi ${productName} (mobile)`}
        role="dialog"
        aria-modal="true"
      >
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
                  aria-current={isActive(item.href, item.exact) ? "page" : undefined}
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
