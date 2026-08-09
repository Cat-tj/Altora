"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";

export type ShellRole = "OWNER" | "MANAGER" | "STAFF";

export type ShellNavItem = {
  href: string;
  label: string;
  roles: ShellRole[];
  /** Rute yang cocok persis saja, mis. `/kasir` yang punya anak sendiri. */
  exact?: boolean;
  icon?: ReactNode;
};

export type ShellNavGroup = {
  label: string;
  items: ShellNavItem[];
};

export type ProductShellProps = {
  children: ReactNode;
  /** Nama produk untuk label navigasi, mis. "Altora Market". */
  productName: string;
  /** Sebutan tenant di produk ini, mis. "Toko" atau "Resto". */
  tenantNoun: string;
  nav: ShellNavGroup[];
  tenantName: string;
  userName: string;
  role: ShellRole;
  logoUrl?: string;
  onSignOut: () => void;
};

const roleLabels: Record<ShellRole, string> = {
  OWNER: "Pemilik",
  MANAGER: "Manajer",
  STAFF: "Staf",
};

/** Logo SVG Altora resmi */
function AltoraLogoMark({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 1024 1024" role="img" aria-label="Altora Logo">
      <defs>
        <linearGradient id="mainGradShell" x1="220" y1="150" x2="790" y2="820" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#9B5ED0" />
          <stop offset="1" stopColor="#8746BC" />
        </linearGradient>
        <linearGradient id="accentGradShell" x1="310" y1="580" x2="790" y2="720" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#D35ACB" />
          <stop offset="1" stopColor="#A96BDD" />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="1024" height="1024" rx="230" fill="url(#mainGradShell)" />
      <g transform="translate(112 92) scale(1.42)">
        <path fill="#FFFFFF" d="M287 22c24 0 44 13 57 36l209 360c14 24 6 54-18 68-23 14-54 6-68-18L287 157 107 468c-14 24-44 32-68 18-24-14-32-44-18-68L230 58c13-23 33-36 57-36z"/>
        <path fill="#9B5ED0" d="M287 196c10 0 18 5 23 14l72 124H192l72-124c5-9 13-14 23-14z"/>
        <path fill="url(#accentGradShell)" d="M118 354c36-38 78-60 126-60 53 0 91 24 127 58 31 29 56 43 90 43h103c31 0 56 25 56 56s-25 56-56 56H457c-65 0-111-28-154-68-30-28-49-35-67-35-24 0-45 10-68 35-21 22-57 23-79 2-22-21-23-57-2-79l31-8z"/>
      </g>
    </svg>
  );
}

/** Icon toggle collapse sidebar */
function SidebarToggleIcon({ isCollapsed }: { isCollapsed: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {isCollapsed ? (
        <>
          <path d="M13 17l5-5-5-5" />
          <path d="M6 17l5-5-5-5" />
        </>
      ) : (
        <>
          <path d="M11 17l-5-5 5-5" />
          <path d="M18 17l-5-5 5-5" />
        </>
      )}
    </svg>
  );
}

/** Icon Logout */
function SignOutIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}

/**
 * Kerangka aplikasi bersama: sidebar, topbar, dan navigasi mobile.
 */
export function ProductShell({
  children,
  productName,
  tenantNoun,
  nav,
  tenantName,
  userName,
  role,
  logoUrl,
  onSignOut,
}: ProductShellProps) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("altora_sidebar_collapsed");
    if (saved === "true") setIsCollapsed(true);
  }, []);

  const toggleSidebar = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem("altora_sidebar_collapsed", String(next));
      return next;
    });
  };

  const groups = nav
    .map((group) => ({ ...group, items: group.items.filter((item) => item.roles.includes(role)) }))
    .filter((group) => group.items.length > 0);

  const isActive = (item: ShellNavItem) =>
    pathname === item.href || (!item.exact && pathname.startsWith(`${item.href}/`));

  const mobileItems = groups.flatMap((group) => group.items).slice(0, 5);

  return (
    <div className={`shell ${isCollapsed ? "is-collapsed" : ""}`}>
      <a className="shell-skip" href="#shell-main">
        Lewati navigasi
      </a>

      <aside className="shell-side" aria-label={`Navigasi ${productName}`}>
        <div className="shell-brand-header">
          <div className="shell-brand">
            <span className="shell-mark">
              {!imgError ? (
                <img
                  src={logoUrl || "/altora-icon.svg"}
                  alt="Altora Logo"
                  className="shell-logo-img"
                  onError={() => setImgError(true)}
                />
              ) : (
                <AltoraLogoMark className="shell-logo-img" />
              )}
            </span>
            {!isCollapsed && (
              <span className="shell-brand-text">
                <strong>{tenantName}</strong>
                <small>{productName}</small>
              </span>
            )}
          </div>
          <button
            className="shell-toggle"
            onClick={toggleSidebar}
            type="button"
            title={isCollapsed ? "Buka sidebar" : "Tutup sidebar"}
            aria-label={isCollapsed ? "Buka sidebar" : "Tutup sidebar"}
          >
            <SidebarToggleIcon isCollapsed={isCollapsed} />
          </button>
        </div>

        <nav aria-label={`Menu ${productName}`}>
          {groups.map((group) => (
            <section className="shell-group" key={group.label}>
              {!isCollapsed && <h2>{group.label}</h2>}
              {group.items.map((item) => (
                <Link
                  aria-current={isActive(item) ? "page" : undefined}
                  className={isActive(item) ? "is-active" : undefined}
                  href={item.href}
                  key={item.href}
                  title={item.label}
                >
                  <span className="shell-nav-icon" aria-hidden="true">
                    {item.label.charAt(0)}
                  </span>
                  {!isCollapsed && <span className="shell-nav-text">{item.label}</span>}
                </Link>
              ))}
            </section>
          ))}
        </nav>

        <div className="shell-user">
          <span className="shell-avatar" aria-hidden="true">
            {userName.slice(0, 1).toUpperCase()}
          </span>
          {!isCollapsed && (
            <span className="shell-user-text">
              <strong>{userName}</strong>
              <small>{roleLabels[role]}</small>
            </span>
          )}
          <button
            className="shell-signout"
            onClick={onSignOut}
            type="button"
            title="Keluar"
            aria-label="Keluar"
          >
            <SignOutIcon />
            {!isCollapsed && <span>Keluar</span>}
          </button>
        </div>
      </aside>

      <div className="shell-body">
        <header className="shell-top">
          <span className="shell-top-tenant">
            <strong>{tenantName}</strong>
            <small>{tenantNoun} · Outlet aktif</small>
          </span>
          <span className="shell-sync">
            <i aria-hidden="true" />
            Tersinkron
          </span>
        </header>

        <main className="shell-main" id="shell-main" tabIndex={-1}>
          {children}
        </main>
      </div>

      <nav className="shell-mobile" aria-label={`Navigasi cepat ${productName}`}>
        {mobileItems.map((item) => (
          <Link
            aria-current={isActive(item) ? "page" : undefined}
            className={isActive(item) ? "is-active" : undefined}
            href={item.href}
            key={item.href}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
