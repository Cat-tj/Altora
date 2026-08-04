"use client";

type Product = { id: string; name: string };

/** Avatar produk konsisten: gradient brand Altora (navy → magenta), teks inisial.
 *  Warna-warni acak terlihat amatir di POS; satu keluarga warna = proper. */
export function ProductVisual({ product }: { product: Product }) {
  const initials = product.name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <div
      aria-hidden
      className="pos-avatar"
      style={{
        background: "linear-gradient(135deg, var(--accent) 0%, #5b2f9e 100%)",
      }}
    >
      <span>{initials || "?"}</span>
    </div>
  );
}
