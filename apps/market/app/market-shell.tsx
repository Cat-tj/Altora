"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import { resolveProductLoginUrl } from "@altora/core/auth-redirect";
import { AppShell, type ShellRole } from "@altora/ui/app-shell";
import { marketNav } from "./market-nav";

/**
 * MarketShell — wrapper tipis yang memanggil AppShell dengan nav Market.
 *
 * TIDAK LAGI menampilkan header dashboard secara global.
 * Setiap route menampilkan page header-nya sendiri.
 *
 * Passes data-theme="market" to scope Market-specific gradient + glass styles.
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
      data-theme="market"
      onSignOut={() =>
        signOut({ callbackUrl: resolveProductLoginUrl(window.location.origin, "market.altora.my.id") })
      }
    >
      {children}
    </AppShell>
  );
}
