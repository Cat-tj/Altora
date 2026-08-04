"use client";

import { useEffect, useState } from "react";
import { signOut } from "next-auth/react";
import { resolveProductLoginUrl } from "@altora/core/auth-redirect";

/**
 * Shell mode kasir (POS) — fullscreen, tanpa sidebar back-office.
 * Kasir hanya butuh: nama outlet, status shift, jam, dan keluar.
 */
export function PosShell({ children, tenantName }: { children: React.ReactNode; tenantName: string }) {
  const [now, setNow] = useState<string>("");

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

  return (
    <div className="pos-shell">
      <header className="pos-topbar">
        <div className="pos-topbar-left">
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
      <main className="pos-main">{children}</main>
    </div>
  );
}
