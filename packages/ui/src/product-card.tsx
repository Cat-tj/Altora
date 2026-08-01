import type { ReactNode } from "react";

export function ProductCard({
  children,
  href,
  name,
  version,
}: {
  children: ReactNode;
  href: string;
  name: string;
  version: string;
}) {
  return (
    <a className="product-card" href={href}>
      <span className="product-card__meta">{name} · v{version}</span>
      <span className="product-card__body">{children}</span>
      <span aria-hidden="true">Masuk →</span>
    </a>
  );
}
