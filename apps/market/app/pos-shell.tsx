"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { resolveProductLoginUrl } from "@altora/core/auth-redirect";
import { marketNav } from "./market-nav";
import type { ShellRole } from "@altora/ui/product-shell";
import { NavIcon } from "@altora/ui/nav-icons";

/**
 * Shell mode kasir (POS):
 *  - Desktop: sidebar ramping yang BISA di-collapse (icon-only + tooltip),
 *    pola Greenie — tetap fokus transaksi, menu back-office selalu di tangan.
 *  - Mobile: drawer overlay dari hamburger.
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
  const [collapsed, setCollapsed] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();

  // Preferensi collapse tersimpan lintas sesi
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem("pos.sidebar.collapsed");
      if (saved === "1") setCollapsed(true);
    } catch {
      /* ignore */
    }
  }, []);
  useEffect(() => {
    try {
      window.localStorage.setItem("pos.sidebar.collapsed", collapsed ? "1" : "0");
    } catch {
      /* ignore */
    }
  }, [collapsed]);

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

  /** Petakan href → nama ikon shared (satu sumber: NAV_ICONS). */
  const iconFor = (href: string): string => {
    if (href === "/simple/hari-ini") return "dashboard";
    if (href === "/kasir") return "kasir";
    if (href === "/kasir/riwayat") return "transaksi";
    if (href === "/retur") return "retur";
    if (href === "/produk") return "produk";
    if (href === "/produk/transfer") return "transfer";
    if (href === "/penerimaan") return "penerimaan";
    if (href === "/opname") return "opname";
    if (href === "/laporan") return "laporan";
    if (href === "/pengeluaran") return "pengeluaran";
    if (href === "/member") return "member";
    if (href === "/promo") return "promo";
    if (href === "/voucher") return "voucher";
    if (href === "/pengaturan") return "pengaturan";
    if (href === "/absensi") return "absensi";
    if (href === "/audit-log") return "audit";
    return "produk";
  };

  const sidebar = (
    <nav className={`pos-sb ${collapsed ? "is-collapsed" : ""}`} aria-label="Navigasi Altora Market">
      <div className="pos-sb-groups">
        {groups.map((group) => (
          <section key={group.label} className="pos-sb-group">
            <p className="pos-sb-label">{group.label}</p>
            {group.items.map((item) => {
              const active = isActive(item.href, item.exact);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`pos-sb-link ${active ? "is-active" : ""}`}
                  title={collapsed ? item.label : undefined}
                >
                  <NavIcon name={iconFor(item.href)} className="pos-sb-icon" />
                  <span className="pos-sb-text">{item.label}</span>
                </Link>
              );
            })}
          </section>
        ))}
      </div>

      <div className="pos-sb-foot">
        <div className="pos-sb-user">
          <span className="pos-sb-avatar" aria-hidden="true">{userName.charAt(0).toUpperCase()}</span>
          <div className="pos-sb-usertext">
            <strong>{userName}</strong>
            <span>{role === "OWNER" ? "Pemilik" : role === "MANAGER" ? "Manajer" : "Staf"}</span>
          </div>
        </div>
        <button
          type="button"
          className="pos-sb-collapse"
          onClick={() => setCollapsed((v) => !v)}
          aria-label={collapsed ? "Perluas sidebar" : "Ciutkan sidebar"}
          title={collapsed ? "Perluas" : "Ciutkan"}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            {collapsed ? <path d="m9 6 6 6-6 6" /> : <path d="m15 6-6 6 6 6" />}
          </svg>
        </button>
      </div>
    </nav>
  );

  return (
    <div className="pos-shell">
      <header className="pos-topbar">
        <div className="pos-topbar-left">
          <button
            type="button"
            className="pos-menu-btn pos-menu-btn-mobile"
            aria-label="Buka menu navigasi"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
          >
            <span /><span /><span />
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

      {/* Drawer mobile — overlay dari kiri */}
      {menuOpen && (
        <div className="pos-drawer-layer pos-drawer-layer-mobile">
          <div className="pos-drawer-backdrop" onClick={() => setMenuOpen(false)} aria-hidden="true" />
          <nav className="pos-drawer" aria-label="Navigasi Altora Market (mobile)">
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
                      <NavIcon name={iconFor(item.href)} className="pos-drawer-icon" />
                      <span>{item.label}</span>
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

      <div className="pos-shell-body">
        <div className="pos-sb-wrap">{sidebar}</div>
        <main className="pos-main">{children}</main>
      </div>
    </div>
  );
}
