"use client";

import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { resolveProductLoginUrl } from "@altora/core/auth-redirect";
import { ProductShell, type ShellRole } from "@altora/ui/product-shell";
import { marketNav } from "./market-nav";
import { PosShell } from "./pos-shell";

/**
 * Market: mode kasir (/kasir*) render fullscreen tanpa sidebar back-office
 * (kasir tidak butuh laporan/produk/member saat melayani). Semua rute lain
 * memakai kerangka bersama dengan sidebar.
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
  const pathname = usePathname();
  const isPos = pathname === "/kasir" || pathname.startsWith("/kasir/");

  if (isPos) {
    return <PosShell tenantName={tenantName}>{children}</PosShell>;
  }

  return (
    <ProductShell
      nav={marketNav}
      onSignOut={() =>
        signOut({ callbackUrl: resolveProductLoginUrl(window.location.origin, "market.altora.my.id") })
      }
      productName="Altora Market"
      role={role}
      tenantName={tenantName}
      tenantNoun="Toko"
      userName={userName}
    >
      {children}
    </ProductShell>
  );
}
