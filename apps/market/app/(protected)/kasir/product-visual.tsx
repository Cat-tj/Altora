"use client";

type Product = { id: string; name: string };

export function ProductVisual({ product }: { product: Product }) {
  const seed = product.name.split("").reduce((s, c) => s + c.charCodeAt(0), 0);
  const palettes: [string, string][] = [
    ["#fef3c7", "#f97316"],
    ["#dcfce7", "#16a34a"],
    ["#e0f2fe", "#0284c7"],
    ["#fce7f3", "#db2777"],
    ["#ede9fe", "#7c3aed"],
  ];
  const palette = palettes[seed % palettes.length] ?? ["#fef3c7", "#f97316"];
  const bg = palette[0];
  const accent = palette[1];
  const initials = product.name.split(/\s+/).filter(Boolean).slice(0, 2).map(p => p[0]?.toUpperCase()).join("");

  return (
    <div
      className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl md:h-[72px] md:w-[72px]"
      style={{ backgroundColor: bg }}
    >
      <div className="absolute -right-5 -top-5 h-16 w-16 rounded-full opacity-20" style={{ backgroundColor: accent }} />
      <div className="absolute -bottom-7 -left-5 h-20 w-20 rounded-full opacity-20" style={{ backgroundColor: accent }} />
      <span className="relative text-lg font-black md:text-xl" style={{ color: accent }}>
        {initials || "P"}
      </span>
    </div>
  );
}
