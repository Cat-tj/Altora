"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import "./scanner-styles.css";

export type BarcodeScanResult = {
  code: string;
  accepted: boolean;
  message: string;
};

const REARM_DELAY_MS = 1100;

export function ContinuousBarcodeScanner({
  onScan,
  onClose,
}: {
  onScan: (barcode: string) => BarcodeScanResult;
  onClose: () => void;
}) {
  const scannerRef = useRef<{ stop: () => Promise<void>; clear?: () => void } | null>(null);
  const lastScanRef = useRef<{ code: string; at: number } | null>(null);
  const [status, setStatus] = useState("Menyiapkan kamera…");
  const [feedback, setFeedback] = useState<BarcodeScanResult | null>(null);

  const stopCamera = useCallback(() => {
    const scanner = scannerRef.current;
    scannerRef.current = null;
    if (!scanner) return;
    void scanner.stop().catch(() => {}).finally(() => {
      try { scanner.clear?.(); } catch { /* scanner DOM may already be gone */ }
    });
  }, []);

  const close = useCallback(() => {
    stopCamera();
    onClose();
  }, [onClose, stopCamera]);

  useEffect(() => {
    let disposed = false;

    async function startCamera() {
      try {
        const { Html5Qrcode } = await import("html5-qrcode");
        if (disposed) return;
        const scanner = new Html5Qrcode("market-continuous-barcode-camera");
        scannerRef.current = scanner;
        await scanner.start(
          { facingMode: "environment" },
          {
            fps: 12,
            qrbox: { width: 280, height: 130 },
            aspectRatio: 1.8,
          },
          (decodedText: string) => {
            const code = decodedText.trim();
            if (!code) return;
            const now = Date.now();
            const previous = lastScanRef.current;
            if (previous?.code === code && now - previous.at < REARM_DELAY_MS) return;
            lastScanRef.current = { code, at: now };
            const result = onScan(code);
            setFeedback(result);
            setStatus(result.accepted ? "Siap untuk barang berikutnya" : "Barcode belum ditemukan — arahkan barang lain atau coba lagi");
            if (result.accepted) {
              navigator.vibrate?.(45);
              try { new Audio("data:audio/wav;base64,UklGRjIAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQ4AAAAAAP8A/wD/AP8A/wD/").play().catch(() => {}); } catch { /* audio is progressive enhancement */ }
            }
          },
          () => {},
        );
        if (!disposed) setStatus("Arahkan kamera ke barcode produk");
      } catch (error) {
        if (!disposed) setStatus(`Kamera tidak tersedia: ${error instanceof Error ? error.message : "pastikan izin kamera diberikan"}`);
      }
    }

    void startCamera();
    return () => { disposed = true; stopCamera(); };
  }, [onScan, stopCamera]);

  return (
    <div className="barcode-overlay" role="dialog" aria-modal="true" aria-label="Scan Barcode">
      <section className="barcode-dialog">
        <header className="barcode-dialog-head">
          <div><h2>Scan Barcode</h2><p>Mode berkelanjutan aktif</p></div>
          <button type="button" className="barcode-close" onClick={close} aria-label="Tutup scanner">×</button>
        </header>
        <div className="barcode-camera-wrap">
          <div id="market-continuous-barcode-camera" />
          <div className="barcode-frame" aria-hidden="true"><span /></div>
        </div>
        <p className="barcode-status">{status}</p>
        {feedback && (
          <div className={`barcode-feedback ${feedback.accepted ? "is-success" : "is-error"}`} role="status">
            <strong>{feedback.accepted ? "✓" : "!"} {feedback.message}</strong>
            <span>{feedback.accepted ? "Ditambahkan ke keranjang" : `Barcode: ${feedback.code}`}</span>
          </div>
        )}
        <p className="barcode-hint">Produk yang sama dapat dipindai lagi setelah keluar dari frame sejenak.</p>
      </section>
    </div>
  );
}
