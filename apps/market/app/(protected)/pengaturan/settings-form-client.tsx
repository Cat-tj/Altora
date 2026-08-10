"use client";

import { useState } from "react";
import QrisScanner from "./qris-scanner";

/**
 * Client-side settings form — uses fetch instead of traditional form submission.
 * Errors show as popup instead of raw error page.
 */
export function SettingsFormClient({
  taxPercent,
  receiptFooter,
  initialQrisPayload,
}: {
  taxPercent: number;
  receiptFooter: string;
  initialQrisPayload: string;
}) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorPopup, setErrorPopup] = useState<{ show: boolean; message: string }>({ show: false, message: "" });

  function showError(msg: string) {
    setErrorPopup({ show: true, message: msg });
    setTimeout(() => setErrorPopup({ show: false, message: "" }), 6000);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);

    const form = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/settings/business", {
        method: "POST",
        body: form,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Gagal menyimpan pengaturan");
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: unknown) {
      showError(err instanceof Error ? err.message : "Terjadi kesalahan saat menyimpan");
    } finally {
      setLoading(false);
    }
  }

  const inputStyle: React.CSSProperties = {
    width: "100%", height: 36, borderRadius: 8,
    border: "1px solid var(--line)", padding: "0 0.75rem",
    fontSize: "0.8rem",
  };

  const labelStyle: React.CSSProperties = {
    display: "block", fontSize: "0.75rem", fontWeight: "600",
    marginBottom: "0.3rem", color: "var(--ink-2)",
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: "grid", gap: "0.7rem", marginTop: "0.7rem" }}>
      {/* Error Popup */}
      {errorPopup.show && (
        <div style={{
          display: "flex", alignItems: "center", gap: "0.6rem",
          padding: "0.7rem 0.9rem", borderRadius: 10,
          background: "#fef2f2", border: "1px solid #fecaca",
        }}>
          <span style={{ fontSize: "1.2rem", flexShrink: 0 }}>⚠️</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "#b91c1c" }}>Error</div>
            <div style={{ fontSize: "0.72rem", color: "#991b1b", marginTop: 2 }}>{errorPopup.message}</div>
          </div>
          <button
            type="button"
            onClick={() => setErrorPopup({ show: false, message: "" })}
            style={{ background: "none", border: "none", color: "#991b1b", cursor: "pointer", fontSize: "1rem", padding: 4 }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Success */}
      {success && (
        <div style={{
          padding: "0.6rem 0.9rem", borderRadius: 10,
          background: "#e4f5ee", border: "1px solid #a7f3d0",
          fontSize: "0.78rem", fontWeight: 600, color: "#0e7a57",
        }}>
          ✅ Pengaturan berhasil disimpan!
        </div>
      )}

      <div>
        <label htmlFor="taxPercent" style={labelStyle}>Pajak Penjualan (%)</label>
        <input
          id="taxPercent"
          name="taxPercent"
          type="number"
          defaultValue={taxPercent}
          style={inputStyle}
        />
      </div>

      <div>
        <label htmlFor="receiptFooter" style={labelStyle}>Pesan Footer Struk</label>
        <textarea
          id="receiptFooter"
          name="receiptFooter"
          rows={2}
          defaultValue={receiptFooter}
          style={{ ...inputStyle, height: "auto", padding: "0.5rem 0.75rem", resize: "vertical" }}
        />
      </div>

      <div>
        <label style={labelStyle}>QRIS Statis (Scan dari Kamera)</label>
        <QrisScanner initialPayload={initialQrisPayload} />
      </div>

      <button
        type="submit"
        disabled={loading}
        style={{
          width: "100%", height: 38, borderRadius: 10,
          backgroundColor: loading ? "var(--muted)" : "var(--accent)",
          color: "#fff", fontWeight: "700", border: "none",
          fontSize: "0.82rem", cursor: loading ? "wait" : "pointer",
          marginTop: "0.2rem",
        }}
      >
        {loading ? "Menyimpan…" : "Simpan Pengaturan"}
      </button>
    </form>
  );
}
