"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { resolveProductLoginUrl } from "@altora/core/auth-redirect";
import { marketNav } from "./market-nav";
import type { ShellRole } from "@altora/ui/product-shell";

/**
 * Shell mode kasir (POS) — fullscreen, tanpa sidebar permanen.
 * Menu back-office muncul sebagai drawer yang hovering dari topbar
 * (pola topbar landing Altora), supaya kasir tetap fokus di layar POS.
 */
export function PosShell({
  children,
  tenantName,
  userName,
  role,
}: {
  children: React.ReactNode;
  tenantName: string;
  userName: string;
  role: ShellRole;
}) {
  const [now, setNow] = useState<string>("");
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const fmt = () =>
      new Intl.DateTimeFormat("id-ID", {
        weekday: "long",
        day: "2-digit",
        month: "long",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }).format(new Date());
    setNow(fmt());
    const t = setInterval(() => setNow(fmt()), 30_000);
    return () => clearInterval(t);
  }, []);

  // Tutup drawer saat pindah halaman / tekan ESC
  useEffect(() => setMenuOpen(false), [pathname]);
  useEffect(() => {
    if (!menuOpen) return;
    const h = (e: KeyboardEvent) => e.key === "Escape" && setMenuOpen(false);
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [menuOpen]);

  const groups = marketNav
    .map((g) => ({ ...g, items: g.items.filter((i) => i.roles.includes(role)) }))
    .filter((g) => g.items.length > 0);

  const isActive = (href: string, exact?: boolean) =>
    pathname === href || (!exact && pathname.startsWith(`${href}/`));

  return (
    <div className="pos-shell">
      <header className="pos-topbar">
        <div className="pos-topbar-left">
          <button
            type="button"
            className="pos-menu-btn"
            aria-label="Buka menu navigasi"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
          >
            <span />
            <span />
            <span />
          </button>
          <span className="pos-mark" aria-hidden="true">A</span>
          <div className="pos-topbar-title">
            <span className="pos-topbar-kicker">Altora Market</span>
            <span className="pos-topbar-tenant">{tenantName}</span>
          </div>
        </div>
        <div className="pos-topbar-right">
          <span className="pos-clock">{now}</span>
          <button
            type="button"
            className="pos-signout"
            onClick={() =>
              signOut({ callbackUrl: resolveProductLoginUrl(window.location.origin, "market.altora.my.id") })
            }
          >
            Keluar
          </button>
        </div>
      </header>

      {/* Drawer navigasi — overlay dari kiri */}
      {menuOpen && (
        <div className="pos-drawer-layer">
          <div className="pos-drawer-backdrop" onClick={() => setMenuOpen(false)} aria-hidden="true" />
          <nav className="pos-drawer" aria-label="Navigasi Altora Market">
            <div className="pos-drawer-head">
              <span className="pos-mark" aria-hidden="true">A</span>
              <div>
                <strong>Altora Market</strong>
                <span className="pos-drawer-user">
                  {userName} · {role === "OWNER" ? "Pemilik" : role === "MANAGER" ? "Manajer" : "Staf"}
                </span>
              </div>
              <button type="button" className="pos-drawer-close" onClick={() => setMenuOpen(false)} aria-label="Tutup menu">
                ✕
              </button>
            </div>

            <div className="pos-drawer-groups">
              {groups.map((group) => (
                <section key={group.label} className="pos-drawer-group">
                  <p className="pos-drawer-label">{group.label}</p>
                  {group.items.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`pos-drawer-link ${isActive(item.href, item.exact) ? "is-active" : ""}`}
                    >
                      {item.label}
                    </Link>
                  ))}
                </section>
              ))}
            </div>

            <div className="pos-drawer-foot">
              <button
                type="button"
                className="pos-drawer-signout"
                onClick={() =>
                  signOut({ callbackUrl: resolveProductLoginUrl(window.location.origin, "market.altora.my.id") })
                }
              >
                Keluar
              </button>
            </div>
          </nav>
        </div>
      )}

      <main className="pos-main">{children}</main>
    </div>
  );
}
