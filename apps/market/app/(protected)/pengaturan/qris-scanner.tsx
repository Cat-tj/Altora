"use client";

import { useRef, useState, useEffect } from "react";

/**
 * QRIS Scanner — live camera scan via Html5Qrcode.
 *
 * Scans real QRIS QR codes from camera in real-time.
 * Validates payload is hex-encoded EMV QRIS before accepting.
 * Shows error popup with red icon if validation fails.
 */
export default function QrisScanner({
  initialPayload = "",
  onPayloadChange,
}: {
  initialPayload?: string;
  onPayloadChange?: (payload: string) => void;
}) {
  const [payload, setPayload] = useState(initialPayload);
  const [scanning, setScanning] = useState(false);
  const [status, setStatus] = useState("");
  const [errorPopup, setErrorPopup] = useState<{ show: boolean; message: string }>({ show: false, message: "" });
  const scannerRef = useRef<{ stop: () => Promise<void>; clear?: () => void } | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => stopCamera();
  }, []);

  function stopCamera() {
    if (scannerRef.current) {
      scannerRef.current.stop().catch(() => {});
      try { scannerRef.current?.clear?.(); } catch (err) { console.warn("Failed to clear scanner", err); }
      scannerRef.current = null;
    }
    setScanning(false);
  }

  function showError(msg: string) {
    setErrorPopup({ show: true, message: msg });
    setTimeout(() => setErrorPopup({ show: false, message: "" }), 5000);
  }

  function validateQrisPayload(data: string): { valid: boolean; error?: string } {
    const trimmed = data.trim();
    if (!trimmed) return { valid: false, error: "Payload kosong." };

    // Check if it's a URL (some QRIS implementations encode URLs)
    if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
      return { valid: false, error: "QR berisi URL, bukan payload QRIS hex. Pastikan QR statis bank yang di-scan, bukan QR dynamic merchant." };
    }

    // Check if it's valid hex
    if (!/^[0-9A-Fa-f]+$/.test(trimmed)) {
      return { valid: false, error: "Payload QRIS harus berisi hex (0-9, A-F). Data yang di-scan bukan QRIS hex yang valid." };
    }

    // Check minimum length (EMV QRIS is typically 100+ chars)
    if (trimmed.length < 50) {
      return { valid: false, error: `Payload terlalu pendek (${trimmed.length} chars). QRIS hex biasanya 100+ karakter.` };
    }

    // Check starts with 000201 (EMV Merchant Presented QR)
    if (!trimmed.startsWith("000201")) {
      return { valid: false, error: "Payload tidak dimulai dengan '000201' (EMV QRIS header). Pastikan ini QRIS statis dari bank." };
    }

    return { valid: true };
  }

  async function startCamera() {
    setStatus("Memulai kamera...");
    try {
      const { Html5Qrcode } = await import("html5-qrcode");
      const scanner = new Html5Qrcode("qris-camera-container");
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 }, aspectRatio: 1 },
        (decodedText: string) => {
          // Validate the scanned QR content
          const validation = validateQrisPayload(decodedText);
          if (validation.valid) {
            const hex = decodedText.trim().toUpperCase();
            setPayload(hex);
            onPayloadChange?.(hex);
            setStatus(`✅ QRIS terbaca! (${hex.substring(0, 30)}...)`);
            stopCamera();
          } else {
            showError(validation.error!);
            setStatus("❌ " + validation.error);
            // Don't stop camera — let user try again
          }
        },
        () => {}, // ignore errors during scanning
      );
      setScanning(true);
      setStatus("📷 Arahkan kamera ke QRIS...");
    } catch (err: unknown) {
      setStatus("");
      showError("Kamera tidak tersedia: " + (err instanceof Error ? err.message : "Pastikan izin kamera diberikan."));
    }
  }

  return (
    <div style={{ display: "grid", gap: "0.6rem" }}>
      {/* Error Popup */}
      {errorPopup.show && (
        <div style={{
          display: "flex", alignItems: "center", gap: "0.6rem",
          padding: "0.7rem 0.9rem", borderRadius: 10,
          background: "#fef2f2", border: "1px solid #fecaca",
          animation: "slideIn 0.2s ease",
        }}>
          <span style={{ fontSize: "1.2rem", flexShrink: 0 }}>⚠️</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "#b91c1c" }}>Error QRIS</div>
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

      {/* Camera container */}
      <div id="qris-camera-container" style={{ borderRadius: 10, overflow: "hidden", minHeight: scanning ? 200 : 0 }} />

      {/* Status */}
      {status && !errorPopup.show && (
        <div style={{
          fontSize: "0.72rem", fontWeight: 600,
          color: status.startsWith("✅") ? "#0e7a57" : status.startsWith("❌") ? "#b91c1c" : "var(--muted)",
          padding: "0.4rem 0.6rem", borderRadius: 8,
          background: status.startsWith("✅") ? "#e4f5ee" : status.startsWith("❌") ? "#fef2f2" : "#f5f5f5",
        }}>
          {status}
        </div>
      )}

      {/* Scanned payload preview */}
      {payload && (
        <div style={{
          padding: "0.5rem 0.7rem", borderRadius: 10,
          border: "1px solid var(--line)", background: "#fafafa",
        }}>
          <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--ink)", marginBottom: 2 }}>
            ✅ Payload QRIS (hex)
          </div>
          <div style={{
            fontSize: "0.62rem", color: "var(--muted)",
            fontFamily: "monospace", wordBreak: "break-all",
            lineHeight: 1.4,
          }}>
            {payload.substring(0, 120)}{payload.length > 120 ? "..." : ""}
          </div>
          <div style={{ fontSize: "0.6rem", color: "var(--muted)", marginTop: 4 }}>
            {payload.length} karakter
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div style={{ display: "flex", gap: "0.5rem" }}>
        <button
          type="button"
          onClick={() => scanning ? stopCamera() : startCamera()}
          style={{
            flex: 1, height: 38, borderRadius: 10,
            border: scanning ? "1px solid #b91c1c" : "1px solid var(--accent)",
            background: scanning ? "#fef2f2" : "#fff",
            color: scanning ? "#b91c1c" : "var(--accent)",
            fontWeight: 700, fontSize: "0.78rem", cursor: "pointer",
          }}
        >
          {scanning ? "⏹ Stop Kamera" : "📷 Scan QRIS dari Kamera"}
        </button>
      </div>

      {/* Hidden payload for form submission */}
      <input type="hidden" name="staticQrisPayload" value={payload} />

      {/* Manual override */}
      <details style={{ fontSize: "0.7rem", color: "var(--muted)" }}>
        <summary style={{ cursor: "pointer" }}>Atau tempel hex manual</summary>
        <textarea
          name="staticQrisPayload"
          rows={2}
          value={payload}
          onChange={(e) => {
            setPayload(e.target.value);
            onPayloadChange?.(e.target.value);
          }}
          placeholder="0002010102112657..."
          style={{
            width: "100%", marginTop: "0.4rem", padding: "0.5rem",
            borderRadius: 8, border: "1px solid var(--line)",
            fontSize: "0.7rem", fontFamily: "monospace",
          }}
        />
      </details>

      <style>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
