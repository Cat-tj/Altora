"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { resolveProductLoginUrl } from "@altora/core/auth-redirect";
import { marketNav } from "./market-nav";
import type { ShellRole } from "@altora/ui/product-shell";

/** Ikon SVG inline per menu (ramping, stroke 1.8, konsisten Greenie-style). */
const ICONS: Record<string, React.ReactNode> = {
  "/simple/hari-ini": <><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></>,
  "/kasir": <><rect x="3" y="7" width="18" height="13" rx="2" /><path d="M16 3H8l-1 4h10L16 3z" /><path d="M12 11v5M9.5 13.5h5" /></>,
  "/kasir/riwayat": <><path d="M6 2h9l4 4v14a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1z" /><path d="M14 2v5h5M8 12h8M8 16h5" /></>,
  "/retur": <><path d="M9 14 4 9l5-5" /><path d="M4 9h10a6 6 0 0 1 0 12h-3" /></>,
  "/produk": <><path d="M21 8 12 3 3 8v8l9 5 9-5V8z" /><path d="M3 8l9 5 9-5M12 13v8" /></>,
  "/produk/transfer": <><path d="M7 4v13M7 4l-3 3M7 4l3 3" /><path d="M17 20V7M17 20l-3-3M17 20l3-3" /></>,
  "/penerimaan": <><path d="M12 3v12M8 11l4 4 4-4" /><path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" /></>,
  "/opname": <><rect x="5" y="3" width="14" height="18" rx="2" /><path d="M9 3V2h6v1M9 12h6M9 16h4" /></>,
  "/laporan": <><path d="M4 20V10M10 20V4M16 20v-8M22 20H2" /></>,
  "/pengeluaran": <><path d="M20 7H4a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z" /><path d="M16 14h.01" /></>,
  "/member": <><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20c1-3.5 3.5-5 6.5-5s5.5 1.5 6.5 5" /><circle cx="17" cy="9" r="2.5" /><path d="M16 15.5c2.8.3 4.8 1.8 5.5 4.5" /></>,
  "/promo": <><path d="M3 12V5a2 2 0 0 1 2-2h7l9 9-9 9-9-9z" /><circle cx="8" cy="8" r="1.5" /></>,
  "/voucher": <><path d="M3 8a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-4V8z" /><path d="M14 8v8" /></>,
  "/pengaturan": <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1 1.55V21a2 2 0 1 1-4 0v-.09a1.7 1.7 0 0 0-1-1.55 1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.7 1.7 0 0 0 .34-1.87 1.7 1.7 0 0 0-1.55-1H3a2 2 0 1 1 0-4h.09a1.7 1.7 0 0 0 1.55-1 1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.7 1.7 0 0 0 1.87.34h0a1.7 1.7 0 0 0 1-1.55V3a2 2 0 1 1 4 0v.09a1.7 1.7 0 0 0 1 1.55h0a1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.7 1.7 0 0 0-.34 1.87v0a1.7 1.7 0 0 0 1.55 1H21a2 2 0 1 1 0 4h-.09a1.7 1.7 0 0 0-1.55 1z" /></>,
  "/absensi": <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  "/audit-log": <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z" /><path d="M14 2v6h6M9 13h6M9 17h6" /></>,
};

function NavIcon({ href }: { href: string }) {
  const icon = ICONS[href] ?? ICONS["/produk"];
  return (
    <svg viewBox="0 0 24 24" className="pos-sb-icon" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {icon}
    </svg>
  );
}

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

  const sidebar = (
    <nav className={`pos-sb ${collapsed ? "is-collapsed" : ""}`} aria-label="Navigasi Altora Market">
      <div className="pos-sb-head">
        <span className="pos-mark" aria-hidden="true">A</span>
        <div className="pos-sb-brand">
          <strong>Altora Market</strong>
          <span>{tenantName}</span>
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
                  <NavIcon href={item.href} />
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
                      <NavIcon href={item.href} />
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
