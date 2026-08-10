"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { startHtml5Scanner } from "../../../lib/camera-scanner";
import type { MarketCategory, MarketProduct } from "../../../lib/market-products";

export function ProductFormModal({
  categories,
  productToEdit,
  triggerButton,
}: {
  categories: MarketCategory[];
  productToEdit?: MarketProduct | null;
  triggerButton?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [scanning, setScanning] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const scannerRef = useRef<any>(null);
  const router = useRouter();

  const isEdit = Boolean(productToEdit);
  const [trackExpiry, setTrackExpiry] = useState(productToEdit?.trackExpiry ?? false);
  const defaultExpiredDate = productToEdit?.expiredAt
    ? new Date(productToEdit.expiredAt).toISOString().split("T")[0]
    : "";
  const [expiredAt, setExpiredAt] = useState(defaultExpiredDate);

  async function stopCamera() {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
      } catch (_) {}
      try {
        await scannerRef.current.clear();
      } catch (_) {}
      scannerRef.current = null;
    }
    setScanning(false);
  }

  async function startCamera() {
    setCameraError("");
    setScanning(true);
    setTimeout(async () => {
      try {
        const scanner = await startHtml5Scanner(
          "pm-barcode-camera",
          (text: string) => {
            const skuInput = document.getElementById("pm-sku") as HTMLInputElement | null;
            if (skuInput) skuInput.value = text;
            stopCamera();
          },
          { qrbox: { width: 250, height: 120 }, aspectRatio: 2 }
        );
        scannerRef.current = scanner;
      } catch (err: any) {
        setScanning(false);
        setCameraError("Kamera tidak tersedia: " + (err?.message || "Pastikan izin kamera diberikan."));
      }
    }, 50);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    stopCamera();

    const form = new FormData(e.currentTarget);
    if (isEdit && productToEdit) {
      form.append("id", productToEdit.id);
    }
    form.set("trackExpiry", String(trackExpiry));

    try {
      const res = await fetch("/api/products", {
        method: isEdit ? "PUT" : "POST",
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
      {triggerButton ? (
        <span onClick={() => setOpen(true)} style={{ cursor: "pointer" }}>{triggerButton}</span>
      ) : (
        <button
          onClick={() => setOpen(true)}
          style={{
            display: "inline-flex", alignItems: "center", gap: ".4rem",
            height: 36, padding: "0 .9rem", borderRadius: 8,
            background: "var(--accent)", color: "#fff",
            fontWeight: 700, fontSize: ".78rem", border: "none", cursor: "pointer",
          }}
        >
          + Tambah Produk
        </button>
      )}

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
                <h2 style={{ margin: 0, fontSize: "1.1rem" }}>
                  {isEdit ? `Edit Produk` : "Tambah Produk"}
                </h2>
                <p style={{ margin: ".25rem 0 0", fontSize: ".8rem", color: "var(--muted)" }}>
                  {isEdit ? `Perbarui informasi ${productToEdit?.name}.` : "Isi data produk baru untuk katalog."}
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
                <input
                  id="pm-name" name="name" type="text" required
                  defaultValue={productToEdit?.name ?? ""}
                  placeholder="Contoh: Indomie Goreng" style={inputStyle}
                />
              </div>

              {/* SKU + Barcode Scanner */}
              <div>
                <label htmlFor="pm-sku" style={labelStyle}>SKU / Barcode</label>
                <div style={{ display: "flex", gap: ".5rem" }}>
                  <input
                    id="pm-sku" name="sku" type="text"
                    defaultValue={productToEdit?.sku ?? ""}
                    placeholder="8997001201001"
                    style={{ ...inputStyle, flex: 1 }}
                  />
                  <button
                    type="button"
                    onClick={() => scanning ? stopCamera() : startCamera()}
                    style={{
                      height: 44, width: 44, borderRadius: "10px", border: "1px solid var(--line)",
                      background: scanning ? "#fef2f2" : "#f0f7ff",
                      cursor: "pointer", fontSize: "1.1rem", display: "flex",
                      alignItems: "center", justifyContent: "center", flexShrink: 0,
                    }}
                    title={scanning ? "Matikan kamera" : "Scan barcode dari kamera"}
                  >
                    {scanning ? "⏹" : "📷"}
                  </button>
                </div>
              </div>

              {/* Camera viewfinder */}
              <div
                id="pm-barcode-camera"
                style={{
                  borderRadius: 10,
                  overflow: "hidden",
                  minHeight: scanning ? 180 : 0,
                  display: scanning ? "block" : "none",
                }}
              />

              {cameraError && (
                <p style={{ margin: 0, padding: ".5rem .75rem", borderRadius: 8, background: "#fff7ed", color: "#c2410c", fontSize: ".8rem" }}>
                  {cameraError}
                </p>
              )}

              <div>
                <label htmlFor="pm-cat" style={labelStyle}>Kategori</label>
                <select
                  id="pm-cat" name="categoryId"
                  defaultValue={productToEdit?.categoryId ?? ""}
                  style={{ ...inputStyle, background: "#fff" }}
                >
                  <option value="">— Pilih kategori —</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: ".75rem" }}>
                <div>
                  <label htmlFor="pm-price" style={labelStyle}>Harga Jual (Rp) *</label>
                  <input
                    id="pm-price" name="price" type="number" min="1" required
                    defaultValue={productToEdit?.price ?? ""}
                    placeholder="3200" style={inputStyle}
                  />
                </div>
                <div>
                  <label htmlFor="pm-cost" style={labelStyle}>Modal (Rp)</label>
                  <input
                    id="pm-cost" name="cost" type="number" min="0"
                    defaultValue={productToEdit?.cost ?? ""}
                    placeholder="2500" style={inputStyle}
                  />
                </div>
              </div>

              {/* Expiry Tracking Section */}
              <div style={{ borderTop: "1px solid var(--line)", paddingTop: ".8rem", display: "grid", gap: ".6rem" }}>
                <label style={{ display: "flex", alignItems: "center", gap: ".5rem", cursor: "pointer", fontSize: ".85rem", fontWeight: 600 }}>
                  <input
                    type="checkbox"
                    checked={trackExpiry}
                    onChange={(e) => setTrackExpiry(e.target.checked)}
                    style={{ width: 16, height: 16, accentColor: "var(--accent)" }}
                  />
                  <span>⏰ Track Tanggal Kadaluwarsa (Expired)</span>
                </label>

                {trackExpiry && (
                  <div style={{ background: "#f8fafc", padding: ".75rem", borderRadius: 8, border: "1px solid var(--line)" }}>
                    <label htmlFor="pm-expiredAt" style={labelStyle}>Tanggal Kadaluwarsa</label>
                    <input
                      id="pm-expiredAt" name="expiredAt" type="date"
                      value={expiredAt}
                      onChange={(e) => setExpiredAt(e.target.value)}
                      style={{ ...inputStyle, background: "#fff" }}
                    />
                    <p style={{ margin: ".3rem 0 0", fontSize: ".72rem", color: "var(--muted)" }}>
                      Aplikasi akan memberikan notifikasi jika produk mendekati tanggal kadaluwarsa.
                    </p>
                  </div>
                )}
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
                  width: "100%", height: "48px", borderRadius: "10px",
                  backgroundColor: loading ? "var(--muted)" : "var(--accent)",
                  color: "#fff", fontWeight: "700", border: "none",
                  marginTop: ".25rem", cursor: loading ? "wait" : "pointer",
                }}
              >
                {loading ? "Menyimpan…" : isEdit ? "Simpan Perubahan" : "Simpan Produk"}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: ".76rem",
  fontWeight: 700,
  marginBottom: ".35rem",
  color: "var(--ink)",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  height: 44,
  padding: "0 .85rem",
  borderRadius: 10,
  border: "1px solid var(--line)",
  fontSize: ".88rem",
  outline: "none",
  boxSizing: "border-box",
};
