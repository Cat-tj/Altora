"use client";

import { signOut } from "next-auth/react";
import { resolveProductLoginUrl } from "@altora/core/auth-redirect";
import { ProductShell, type ShellRole } from "@altora/ui/product-shell";
import { restoNav } from "./resto-nav";

/**
 * Pembungkus tipis di atas kerangka bersama: Resto hanya menyumbang
 * navigasinya sendiri dan tujuan logout ke origin Resto.
 */
export function RestoShell({
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
      nav={restoNav}
      onSignOut={() =>
        signOut({ callbackUrl: resolveProductLoginUrl(window.location.origin, "resto.altora.my.id") })
      }
      productName="Altora Resto"
      role={role}
      tenantName={tenantName}
      tenantNoun="Restoran"
      userName={userName}
    >
      {children}
    </ProductShell>
  );
}
