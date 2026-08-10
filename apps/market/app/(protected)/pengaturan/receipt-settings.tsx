"use client";

import { useEffect, useState } from "react";

export function ReceiptSettings() {
  const [width, setWidth] = useState<"58mm" | "80mm">("80mm");
  useEffect(() => { const saved = window.localStorage.getItem("altora-receipt-width"); if (saved === "58mm" || saved === "80mm") setWidth(saved); }, []);
  const select = (value: "58mm" | "80mm") => { setWidth(value); window.localStorage.setItem("altora-receipt-width", value); };
  return <section className="market-panel" aria-labelledby="receipt-settings-title"><div className="market-panel-heading"><h2 id="receipt-settings-title">Pengaturan Struk & Printer</h2></div><p style={{ color: "var(--muted)", fontSize: "0.8rem" }}>Pilih ukuran kertas thermal default untuk mencetak struk.</p><div style={{ display: "flex", gap: "0.6rem", marginTop: "0.8rem" }}><button type="button" onClick={() => select("58mm")} aria-pressed={width === "58mm"} style={{ padding: "0.65rem 1rem", borderRadius: 8, border: "1px solid var(--line)", background: width === "58mm" ? "var(--accent)" : "var(--surface)", color: width === "58mm" ? "#fff" : "inherit", fontWeight: 700 }}>58mm</button><button type="button" onClick={() => select("80mm")} aria-pressed={width === "80mm"} style={{ padding: "0.65rem 1rem", borderRadius: 8, border: "1px solid var(--line)", background: width === "80mm" ? "var(--accent)" : "var(--surface)", color: width === "80mm" ? "#fff" : "inherit", fontWeight: 700 }}>80mm</button></div><p style={{ marginTop: "0.6rem", fontSize: "0.75rem", color: "var(--muted)" }}>Ukuran aktif: {width}</p></section>;
}
