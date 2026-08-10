"use client";

import { useEffect, useRef, useState } from "react";
import { startHtml5Scanner } from "../../../lib/camera-scanner";
import { XIcon } from "./icons";

type Props = {
  onScan: (barcode: string) => void;
  onClose: () => void;
  lastScannedItem?: string | null;
};

export function CameraBarcodeModal({ onScan, onClose, lastScannedItem }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [scanCount, setScanCount] = useState(0);
  const isProcessingRef = useRef(false);
  const scannerRef = useRef<any>(null);

  useEffect(() => {
    let active = true;

    async function initScanner() {
      try {
        setLoading(true);
        setError(null);

        const instance = await startHtml5Scanner(
          "camera-barcode-viewfinder",
          (decodedText) => {
            if (!active || isProcessingRef.current) return;
            isProcessingRef.current = true;
            setScanCount((prev) => prev + 1);
            onScan(decodedText);

            // Cooldown 1.2 detik sebelum mengizinkan scan barcode berikutnya
            setTimeout(() => {
              isProcessingRef.current = false;
            }, 1200);
          },
          {
            qrbox: { width: 280, height: 160 },
            fps: 15,
            aspectRatio: 1.5,
          }
        );

        if (active) {
          scannerRef.current = instance;
          setLoading(false);
        } else {
          instance.stop().catch(() => {});
        }
      } catch (err: any) {
        if (active) {
          setError(err.message || "Gagal mengaktifkan kamera. Pastikan izin kamera diberikan.");
          setLoading(false);
        }
      }
    }

    initScanner();

    return () => {
      active = false;
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
        scannerRef.current = null;
      }
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b px-4 py-3" style={{ borderColor: "var(--market-line)" }}>
          <div className="flex items-center gap-2">
            <span className="text-xl">📷</span>
            <div>
              <h3 className="text-sm font-bold" style={{ color: "var(--market-ink)" }}>Scan Barcode via Kamera</h3>
              <p className="text-xs text-gray-500">Arahkan barcode ke kotak pemindai</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"
          >
            <XIcon className="h-4 w-4" />
          </button>
        </div>

        {/* Camera Viewfinder Area */}
        <div className="relative min-h-[300px] bg-black flex items-center justify-center">
          {loading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-white space-y-2 z-10 bg-gray-900">
              <span className="animate-spin text-3xl">⏳</span>
              <p className="text-xs font-medium">Memulai kamera…</p>
            </div>
          )}

          {error ? (
            <div className="p-6 text-center text-white space-y-3">
              <span className="text-3xl">⚠️</span>
              <p className="text-sm text-red-300 font-semibold">{error}</p>
              <p className="text-xs text-gray-400">Pastikan perangkat memiliki kamera dan izin akses kamera di-izinkan pada browser.</p>
              <button
                onClick={onClose}
                className="mt-2 rounded-xl bg-white/20 px-4 py-2 text-xs font-bold text-white hover:bg-white/30"
              >
                Tutup Scanner
              </button>
            </div>
          ) : (
            <div className="w-full h-full">
              <div id="camera-barcode-viewfinder" className="w-full overflow-hidden" />
            </div>
          )}

          {/* Visual Scan Status Banner */}
          {lastScannedItem && (
            <div className="absolute top-3 left-3 right-3 z-20 rounded-xl bg-emerald-600/90 px-3 py-2 text-center text-xs font-bold text-white shadow-md backdrop-blur-sm animate-bounce">
              {lastScannedItem}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between border-t px-4 py-3" style={{ borderColor: "var(--market-line)", background: "#fafbfa" }}>
          <div className="text-xs text-gray-600">
            <span className="font-semibold">{scanCount}</span> barcode ter-scan
          </div>
          <button
            onClick={onClose}
            className="rounded-xl px-5 py-2 text-xs font-bold text-white shadow-sm"
            style={{ backgroundColor: "var(--accent)" }}
          >
            Selesai ({scanCount})
          </button>
        </div>
      </div>
    </div>
  );
}
