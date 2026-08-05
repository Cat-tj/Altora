"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import { resolveProductLoginUrl } from "@altora/core/auth-redirect";
import { AppShell, type ShellRole } from "@altora/ui/app-shell";
import { marketNav } from "./market-nav";

/**
 * MarketGlobalHeader — brand header above main content.
 * Shows page context, primary CTA, and secondary actions.
 * Rendered inside AppShell's header slot.
 */
function MarketGlobalHeader() {
  return (
    <div className="market-header">
      <div className="market-header-left">
        <p>Beranda toko</p>
        <h1>Operasional hari ini</h1>
        <span>Ringkasan transaksi dan stok dari data Market Anda.</span>
      </div>
      <div className="market-header-actions">
        <Link href="/kasir" className="btn-primary">Buka Kasir</Link>
        <Link href="/produk" className="btn-secondary">Lihat Produk</Link>
      </div>
    </div>
  );
}

/**
 * MarketShell — wrapper tipis yang memanggil AppShell dengan nav Market.
 *
 * SATU komponen untuk SEMUA halaman (kasir, produk, transaksi, dll).
 * Tidak ada PosShell / ProductShell terpisah.
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
      header={<MarketGlobalHeader />}
      onSignOut={() =>
        signOut({ callbackUrl: resolveProductLoginUrl(window.location.origin, "market.altora.my.id") })
      }
    >
      {children}
    </AppShell>
  );
}
