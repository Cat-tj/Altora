"use client";

import { useCallback, useEffect, useActionState, useRef, useState } from "react";
import { applyCountAction, cancelCountAction, createCountAction, type CountState } from "./actions";
import { startHtml5Scanner } from "../../../lib/camera-scanner";

const initial: CountState = {};

function CameraModal({ onScan, onClose }: { onScan: (code: string) => void; onClose: () => void }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const scannerRef = useRef<any>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(async () => {
      if (cancelled) return;
      try {
        const scanner = await startHtml5Scanner(
          "opname-camera",
          (text: string) => {
            onScan(text);
            scanner?.stop().catch(() => {});
            onClose();
          },
          { qrbox: { width: 250, height: 150 }, aspectRatio: 1.5 }
        );
        scannerRef.current = scanner;
      } catch (err: any) {
        if (!cancelled) setError(err?.message || "Gagal membuka kamera.");
      }
    }, 50);

    return () => {
      cancelled = true;
      clearTimeout(timer);
      scannerRef.current?.stop().catch(() => {});
      scannerRef.current?.clear().catch(() => {});
    };
  }, [onScan, onClose]);

  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,.6)",
        display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem",
      }}
    >
      <div style={{
        background: "#fff", borderRadius: 12, padding: "1rem", width: "100%", maxWidth: 360,
        display: "flex", flexDirection: "column", gap: ".6rem",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <strong style={{ fontSize: ".85rem" }}>📷 Scan Barcode Produk</strong>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: "1.2rem", cursor: "pointer" }}>✕</button>
        </div>
        <div id="opname-camera" ref={containerRef} style={{ width: "100%", borderRadius: 8, overflow: "hidden", minHeight: 180 }} />
        {error ? (
          <p style={{ margin: 0, padding: ".5rem", borderRadius: 6, background: "#fef2f2", color: "#dc2626", fontSize: ".75rem", textAlign: "center" }}>
            {error}
          </p>
        ) : (
          <p style={{ fontSize: ".7rem", color: "#888", textAlign: "center", margin: 0 }}>Arahkan kamera ke barcode produk (HP / Laptop)</p>
        )}
      </div>
    </div>
  );
}

function Notice({ state }: { state: CountState }) {
  if (state.error) return <p className="market-form-error" role="alert">{state.error}</p>;
  if (state.success) return <p className="market-form-success" role="status">{state.success}</p>;
  return null;
}

export function CountSheetForm({
  outlets,
  products,
}: {
  outlets: { id: string; name: string }[];
  products: { id: string; name: string; sku: string | null; systemQty: number }[];
}) {
  const [state, action, pending] = useActionState(createCountAction, initial);
  const [counted, setCounted] = useState<Record<string, string>>({});
  const [scanInput, setScanInput] = useState("");
  const [scanFeedback, setScanFeedback] = useState<{ type: "found" | "notfound"; name: string } | null>(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const scanRef = useRef<HTMLInputElement>(null);
  const inputRefs = useRef<Record<string, HTMLInputElement>>({});

  /* Saldo sistem sengaja tidak diperlihatkan sebelum diisi. */
  const filled = Object.entries(counted).filter(([, value]) => value.trim() !== "");
  const countedIds = new Set(filled.map(([id]) => id));

  /* Scan barcode → cari produk → fokus input hitung */
  const handleScan = useCallback((code: string) => {
    const trimmed = code.trim();
    if (!trimmed) return;
    const match = products.find(
      (p) => p.sku?.toLowerCase() === trimmed.toLowerCase() || p.name.toLowerCase() === trimmed.toLowerCase()
    );
    if (match) {
      setScanFeedback({ type: "found", name: match.name });
      /* Fokus input hitungan produk yang cocok */
      setTimeout(() => {
        const el = inputRefs.current[match.id];
        if (el) {
          el.closest("tr")?.scrollIntoView({ behavior: "smooth", block: "center" });
          el.focus();
          el.select();
        }
      }, 50);
    } else {
      setScanFeedback({ type: "notfound", name: trimmed });
    }
    setScanInput("");
    /* Hilangkan feedback setelah 2.5 detik */
    setTimeout(() => setScanFeedback(null), 2500);
  }, [products]);

  /* Auto-focus scan input saat mount */
  useEffect(() => {
    scanRef.current?.focus();
  }, []);

  /* Keyboard shortcut: tekan / untuk focus scan input */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "/" && document.activeElement?.tagName !== "INPUT" && document.activeElement?.tagName !== "SELECT") {
        e.preventDefault();
        scanRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <form action={action} className="receipt-form">
      <Notice state={state} />

      {/* ── Outlet & Catatan ── */}
      <div className="receipt-row">
        <label>
          Outlet
          <select name="outletId" required>
            {outlets.map((outlet) => (
              <option key={outlet.id} value={outlet.id}>{outlet.name}</option>
            ))}
          </select>
        </label>
        <label>
          Catatan
          <input name="notes" placeholder="Opsional, mis. opname rak sembako" type="text" />
        </label>
      </div>

      {/* ── Scan Barcode ── */}
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: ".6rem",
        border: "2px solid var(--market-teal)",
        borderRadius: ".65rem",
        padding: ".55rem .75rem",
        background: "#f0faf8",
      }}>
        <span style={{ fontSize: "1.3rem" }}>📷</span>
        <div style={{ flex: 1 }}>
          <input
            ref={scanRef}
            value={scanInput}
            onChange={(e) => setScanInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleScan(scanInput);
              }
            }}
            placeholder="Scan barcode atau ketik nama produk lalu tekan Enter"
            autoComplete="off"
            style={{
              width: "100%",
              border: "0",
              background: "transparent",
              fontSize: ".95rem",
              fontWeight: 700,
              color: "var(--market-ink)",
              outline: "none",
            }}
          />
        </div>
        <button
          type="button"
          onClick={() => setCameraOpen(true)}
          style={{
            flexShrink: 0, height: 36, padding: "0 .7rem", borderRadius: 8,
            border: "1.5px solid var(--market-teal)", background: "#fff",
            color: "var(--market-teal)", fontWeight: 700, fontSize: ".75rem",
            cursor: "pointer", whiteSpace: "nowrap",
          }}
        >
          📷 Kamera
        </button>
        {scanFeedback && (
          <span style={{
            fontSize: ".78rem",
            fontWeight: 700,
            color: scanFeedback.type === "found" ? "var(--market-teal)" : "#ad2d16",
            whiteSpace: "nowrap",
          }}>
            {scanFeedback.type === "found" ? `✓ ${scanFeedback.name}` : `✗ "${scanFeedback.name}" tidak ditemukan`}
          </span>
        )}
      </div>

      {/* ── Progress ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: ".78rem", color: "var(--market-muted)" }}>
        <span>{filled.length} / {products.length} produk dihitung</span>
        <span>Tekan <kbd style={{ padding: ".1rem .35rem", border: "1px solid #ccc", borderRadius: ".25rem", fontSize: ".72rem" }}>/</kbd> untuk scan</span>
      </div>

      {/* ── Tabel Hitung ── */}
      <div className="market-table-scroll" style={{ border: "1px solid var(--market-line)", borderRadius: ".65rem" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <caption className="sr-only">Lembar hitung stok</caption>
          <thead>
            <tr style={{ borderBottom: "2px solid var(--market-line)" }}>
              <th scope="col" style={{ padding: ".6rem .75rem", textAlign: "left", fontSize: ".72rem", fontWeight: 800, color: "var(--market-muted)", textTransform: "uppercase", letterSpacing: ".04em" }}>Produk</th>
              <th scope="col" style={{ padding: ".6rem .75rem", textAlign: "center", fontSize: ".72rem", fontWeight: 800, color: "var(--market-muted)", textTransform: "uppercase", letterSpacing: ".04em", width: "120px" }}>Fisik</th>
              <th scope="col" style={{ padding: ".6rem .75rem", textAlign: "center", fontSize: ".72rem", fontWeight: 800, color: "var(--market-muted)", textTransform: "uppercase", letterSpacing: ".04em", width: "140px" }}>Selisih</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => {
              const value = counted[product.id] ?? "";
              const delta = value.trim() === "" ? null : Number(value) - product.systemQty;
              const isCounted = countedIds.has(product.id);
              return (
                <tr
                  key={product.id}
                  style={{
                    borderBottom: "1px solid #f0f0f0",
                    background: isCounted ? "#f8fdf9" : "transparent",
                    transition: "background .2s",
                  }}
                >
                  <td style={{ padding: ".6rem .75rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: ".5rem" }}>
                      {isCounted && <span style={{ color: "var(--market-teal)", fontSize: ".9rem" }}>✓</span>}
                      <div>
                        <strong style={{ fontSize: ".85rem" }}>{product.name}</strong>
                        <span className="receipt-meta" style={{ fontSize: ".72rem" }}>{product.sku ?? "tanpa barcode"}</span>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: ".5rem .75rem", textAlign: "center" }}>
                    <input
                      ref={(el) => { if (el) inputRefs.current[product.id] = el; }}
                      aria-label={`Hitungan fisik ${product.name}`}
                      min={0}
                      name={`count__${product.id}`}
                      onChange={(event) =>
                        setCounted((current) => ({ ...current, [product.id]: event.target.value }))
                      }
                      placeholder="—"
                      type="number"
                      value={value}
                      style={{
                        width: "72px",
                        textAlign: "center",
                        padding: ".4rem .5rem",
                        border: "1px solid #d5ddd9",
                        borderRadius: ".45rem",
                        fontSize: ".9rem",
                        fontWeight: 700,
                      }}
                    />
                  </td>
                  <td style={{ padding: ".5rem .75rem", textAlign: "center" }}>
                    {delta === null ? (
                      <span className="count-skip" style={{ fontSize: ".78rem" }}>—</span>
                    ) : delta === 0 ? (
                      <span className="count-match" style={{ fontSize: ".78rem" }}>✓ Cocok</span>
                    ) : (
                      <span className={delta > 0 ? "count-surplus" : "count-shortage"} style={{ fontSize: ".78rem" }}>
                        {delta > 0 ? `+${delta}` : delta}
                        <span style={{ color: "var(--market-muted)", marginLeft: ".3rem" }}>(sistem {product.systemQty})</span>
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <button className="market-checkout-button" disabled={pending || filled.length === 0} type="submit" style={{ marginTop: ".5rem" }}>
        {pending ? "Menyimpan…" : `Simpan draft (${filled.length} produk dihitung)`}
      </button>

      {cameraOpen && (
        <CameraModal
          onScan={handleScan}
          onClose={() => setCameraOpen(false)}
        />
      )}
    </form>
  );
}

export function ApplyCountButton({ countId }: { countId: string }) {
  const [state, action, pending] = useActionState(applyCountAction, initial);
  return (
    <form action={action} className="receipt-inline-form">
      <input name="countId" type="hidden" value={countId} />
      <button className="market-checkout-button" disabled={pending} type="submit">
        {pending ? "Menerapkan…" : "Terapkan ke stok"}
      </button>
      <Notice state={state} />
    </form>
  );
}

export function CancelCountButton({ countId }: { countId: string }) {
  const [state, action, pending] = useActionState(cancelCountAction, initial);
  return (
    <form action={action} className="receipt-inline-form">
      <input name="countId" type="hidden" value={countId} />
      <button className="market-link-button" disabled={pending} type="submit">
        {pending ? "Membatalkan…" : "Batalkan draft"}
      </button>
      <Notice state={state} />
    </form>
  );
}
