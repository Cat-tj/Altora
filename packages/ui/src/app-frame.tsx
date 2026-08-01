import type { ReactNode } from "react";

export function AppFrame({
  children,
  eyebrow,
  title,
  version,
}: {
  children: ReactNode;
  eyebrow: string;
  title: string;
  version: string;
}) {
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">Lewati navigasi</a>
      <header className="app-header">
        <a className="brand" href="https://altora.my.id">ALTORA</a>
        <span className="version" aria-label={`Versi ${version}`}>v{version}</span>
      </header>
      <main id="main-content" className="app-main">
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        {children}
      </main>
    </div>
  );
}
