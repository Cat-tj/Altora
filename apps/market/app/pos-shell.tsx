"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { resolveProductLoginUrl } from "@altora/core/auth-redirect";
import { marketNav } from "./market-nav";
import { AppSidebar } from "@altora/ui/app-sidebar";
import { AppDrawer } from "@altora/ui/app-drawer";
import type { ShellRole } from "@altora/ui/product-shell";

/**
 * Shell mode kasir (POS):
 *  - Desktop: sidebar SAMA dengan halaman lain (AppSidebar shared).
 *  - Mobile: drawer SAMA dengan halaman lain (AppDrawer shared).
 *  Jadi navigasi identik di seluruh aplikasi — tidak ada gaya kedua.
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

  const signOutPos = () =>
    signOut({ callbackUrl: resolveProductLoginUrl(window.location.origin, "market.altora.my.id") });

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
          <button type="button" className="pos-signout" onClick={signOutPos}>
            Keluar
          </button>
        </div>
      </header>

      <div className="pos-shell-body">
        <div className="pos-sb-wrap">
          <AppSidebar nav={marketNav} userName={userName} role={role} onSignOut={signOutPos} />
        </div>
        <main className="pos-main">{children}</main>
      </div>

      <AppDrawer
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        nav={marketNav}
        userName={userName}
        role={role}
        onSignOut={signOutPos}
        productName="Altora Market"
      />
    </div>
  );
}
