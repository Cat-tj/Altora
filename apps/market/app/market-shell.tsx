"use client";

import { signOut } from "next-auth/react";
import { resolveProductLoginUrl } from "@altora/core/auth-redirect";
import { AppShell, type ShellRole } from "@altora/ui/app-shell";
import { marketNav } from "./market-nav";

/**
 * MarketShell — wrapper tipis yang memanggil AppShell dengan nav Market.
 *
 * SATU komponen untuk SEMUA halaman (kasir, produk, transaksi, dll).
 * Tidak ada PosShell / ProductShell terpisah.
 */
export function MarketShell({
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
  return (
    <AppShell
      productName="Altora Market"
      tenantName={tenantName}
      userName={userName}
      role={role}
      nav={marketNav}
      onSignOut={() =>
        signOut({ callbackUrl: resolveProductLoginUrl(window.location.origin, "market.altora.my.id") })
      }
    >
      {children}
    </AppShell>
  );
}
