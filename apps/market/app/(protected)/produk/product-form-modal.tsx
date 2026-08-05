"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

type Category = { id: string; name: string };

const inputStyle: React.CSSProperties = {
  width: "100%",
  height: "52px",
  borderRadius: "999px",
  border: "1px solid var(--line)",
  padding: "0 1.25rem",
  fontSize: "1rem",
  boxSizing: "border-box",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "0.875rem",
  fontWeight: "600",
  marginBottom: "0.5rem",
  color: "var(--ink)",
};

export function ProductFormModal({ categories }: { categories: Category[] }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [scanning, setScanning] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  // Cleanup camera on unmount or close
  useEffect(() => {
    return () => stopCamera();
  }, []);

  function stopCamera() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setScanning(false);
  }

  async function startCamera() {
    setCameraError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setScanning(true);
    } catch {
      setCameraError("Tidak bisa akses kamera. Pastikan izin kamera sudah diberikan.");
    }
  }

  // Barcode detection via BarcodeDetector API (Chrome Android / some browsers)
  useEffect(() => {
    if (!scanning || !videoRef.current) return;
    let raf: number;
    let detector: any = null;

    const BarcodeDetectorClass = (window as any).BarcodeDetector;
    if (BarcodeDetectorClass) {
      detector = new BarcodeDetectorClass({ formats: ["ean_13", "ean_8", "upc_a", "upc_e", "code_128", "code_39", "qr_code"] });
    }

    function tick() {
      if (!detector || !videoRef.current || videoRef.current.readyState < 2) {
        raf = requestAnimationFrame(tick);
        return;
      }
      detector.detect(videoRef.current).then((barcodes: any[]) => {
        if (barcodes.length > 0) {
          const code = barcodes[0].rawValue;
          const skuInput = document.getElementById("pm-sku") as HTMLInputElement | null;
          if (skuInput) skuInput.value = code;
          stopCamera();
          return;
        }
        raf = requestAnimationFrame(tick);
      }).catch(() => {
        raf = requestAnimationFrame(tick);
      });
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [scanning]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const form = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/products", {
        method: "POST",
        body: form,
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Gagal menyimpan produk");
      }
      setOpen(false);
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  }

  function handleClose() {
    stopCamera();
    setOpen(false);
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        style={{
          display: "inline-flex", alignItems: "center", gap: ".4rem",
          height: 36, padding: "0 .9rem", borderRadius: 8,
          background: "var(--accent)", color: "#fff",
          fontWeight: 700, fontSize: ".78rem", border: "none", cursor: "pointer",
        }}
      >
        + Tambah
      </button>

      {open && (
        <div
          onClick={handleClose}
          style={{
            position: "fixed", inset: 0, zIndex: 999,
            background: "rgba(0,0,0,.4)", display: "flex",
            alignItems: "center", justifyContent: "center",
            padding: "1rem",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#fff", borderRadius: 16, width: "100%", maxWidth: 480,
              maxHeight: "90vh", overflow: "auto", boxShadow: "0 8px 32px rgba(0,0,0,.18)",
            }}
          >
            <div style={{ padding: "1.5rem 1.5rem 0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h2 style={{ margin: 0, fontSize: "1.1rem" }}>Tambah Produk</h2>
                <p style={{ margin: ".25rem 0 0", fontSize: ".8rem", color: "var(--muted)" }}>
                  Isi data produk baru untuk katalog.
                </p>
              </div>
              <button
                onClick={handleClose}
                style={{
                  width: 32, height: 32, borderRadius: 8, border: "none",
                  background: "var(--line)", cursor: "pointer", fontSize: "1.1rem",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ padding: "1.25rem 1.5rem 1.5rem", display: "grid", gap: "1rem" }}>
              <div>
                <label htmlFor="pm-name" style={labelStyle}>Nama Produk *</label>
                <input id="pm-name" name="name" type="text" required placeholder="Contoh: Indomie Goreng" style={inputStyle} />
              </div>

              {/* SKU + Barcode Scanner */}
              <div>
                <label htmlFor="pm-sku" style={labelStyle}>SKU / Barcode</label>
                <div style={{ display: "flex", gap: ".5rem" }}>
                  <input
                    id="pm-sku" name="sku" type="text"
                    placeholder="8997001201001"
                    style={{ ...inputStyle, flex: 1 }}
                  />
                  <button
                    type="button"
                    onClick={() => scanning ? stopCamera() : startCamera()}
                    style={{
                      height: 52, width: 52, borderRadius: "999px", border: "1px solid var(--line)",
                      background: scanning ? "#fef2f2" : "#f0f7ff",
                      cursor: "pointer", fontSize: "1.3rem", display: "flex",
                      alignItems: "center", justifyContent: "center", flexShrink: 0,
                    }}
                    title={scanning ? "Matikan kamera" : "Scan barcode dari kamera"}
                  >
                    {scanning ? "⏹" : "📷"}
                  </button>
                </div>
              </div>

              {/* Camera viewfinder */}
              {scanning && (
                <div style={{ position: "relative", borderRadius: 12, overflow: "hidden", background: "#000" }}>
                  <video
                    ref={videoRef}
                    style={{ width: "100%", height: 200, objectFit: "cover", display: "block" }}
                    playsInline
                    muted
                  />
                  {/* Scan line animation */}
                  <div style={{
                    position: "absolute", left: "10%", right: "10%", top: "50%",
                    height: 2, background: "var(--accent)", boxShadow: "0 0 8px var(--accent)",
                    transform: "translateY(-50%)", animation: "scanPulse 1.5s ease-in-out infinite",
                  }} />
                  <p style={{
                    position: "absolute", bottom: 8, left: 0, right: 0,
                    textAlign: "center", color: "#fff", fontSize: ".75rem",
                    textShadow: "0 1px 4px rgba(0,0,0,.6)", margin: 0,
                  }}>
                    Arahkan kamera ke barcode
                  </p>
                </div>
              )}

              {cameraError && (
                <p style={{ margin: 0, padding: ".5rem .75rem", borderRadius: 8, background: "#fff7ed", color: "#c2410c", fontSize: ".8rem" }}>
                  {cameraError}
                </p>
              )}

              <div>
                <label htmlFor="pm-cat" style={labelStyle}>Kategori</label>
                <select id="pm-cat" name="categoryId" style={{ ...inputStyle, background: "#fff" }}>
                  <option value="">— Pilih kategori —</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: ".75rem" }}>
                <div>
                  <label htmlFor="pm-price" style={labelStyle}>Harga Jual (Rp) *</label>
                  <input id="pm-price" name="price" type="number" min="1" required placeholder="3200" style={inputStyle} />
                </div>
                <div>
                  <label htmlFor="pm-cost" style={labelStyle}>Modal (Rp)</label>
                  <input id="pm-cost" name="cost" type="number" min="0" placeholder="2500" style={inputStyle} />
                </div>
              </div>

              {error && (
                <p style={{ margin: 0, padding: ".6rem .8rem", borderRadius: 8, background: "#fef2f2", color: "#b91c1c", fontSize: ".8rem" }}>
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: "100%", height: "52px", borderRadius: "999px",
                  backgroundColor: loading ? "var(--muted)" : "var(--accent)",
                  color: "#fff", fontWeight: "700", border: "none",
                  marginTop: ".25rem", cursor: loading ? "wait" : "pointer",
                }}
              >
                {loading ? "Menyimpan…" : "Simpan Produk"}
              </button>
            </form>
          </div>
        </div>
      )}

      <style>{`
        @keyframes scanPulse {
          0%, 100% { opacity: .4; }
          50% { opacity: 1; }
        }
      `}</style>
    </>
  );
}
