"use client";

import { signOut } from "next-auth/react";
import { resolveProductLoginUrl } from "@altora/core/auth-redirect";
import { ProductShell, type ShellRole } from "@altora/ui/product-shell";
import { marketNav } from "./market-nav";

/**
 * Pembungkus tipis di atas kerangka bersama: Market hanya menyumbang
 * navigasinya sendiri dan tujuan logout ke origin Market.
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
    <ProductShell
      nav={marketNav}
      onSignOut={() =>
        signOut({ callbackUrl: resolveProductLoginUrl(window.location.origin, "market.altora.my.id") })
      }
      productName="Altora Market"
      logoUrl="/altora-icon.svg"
      role={role}
      tenantName={tenantName}
      tenantNoun="Toko"
      userName={userName}
    >
      {children}
    </ProductShell>
  );
}
