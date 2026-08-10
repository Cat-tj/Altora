"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function DeleteProductButton({ productId, productName }: { productId: string; productName: string }) {
  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const router = useRouter();

  async function handleDelete() {
    setLoading(true);
    try {
      const res = await fetch(`/api/products?id=${productId}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Gagal menghapus produk");
      }
      setConfirming(false);
      router.refresh();
    } catch (err: any) {
      alert(err.message || "Gagal menghapus produk");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setConfirming(true)}
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: "4px 8px",
          borderRadius: 6,
          color: "#dc2626",
          fontSize: "0.85rem",
        }}
        title="Hapus Produk"
      >
        🗑️
      </button>

      {confirming && (
        <div
          onClick={() => setConfirming(false)}
          style={{
            position: "fixed", inset: 0, zIndex: 9999,
            background: "rgba(0,0,0,.4)", display: "flex",
            alignItems: "center", justifyContent: "center", padding: "1rem",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#fff", borderRadius: 12, padding: "1.25rem",
              width: "100%", maxWidth: 380, display: "flex", flexDirection: "column", gap: "1rem",
            }}
          >
            <h3 style={{ margin: 0, fontSize: "1rem", color: "#111" }}>Hapus Produk?</h3>
            <p style={{ margin: 0, fontSize: ".85rem", color: "#555", lineHeight: 1.4 }}>
              Apakah Anda yakin ingin menghapus <strong>{productName}</strong>? Produk akan dinonaktifkan dari katalog retail.
            </p>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: ".5rem" }}>
              <button
                onClick={() => setConfirming(false)}
                disabled={loading}
                style={{
                  padding: "6px 14px", borderRadius: 8, border: "1px solid var(--line)",
                  background: "#fff", cursor: "pointer", fontSize: ".8rem", fontWeight: 600,
                }}
              >
                Batal
              </button>
              <button
                onClick={handleDelete}
                disabled={loading}
                style={{
                  padding: "6px 14px", borderRadius: 8, border: "none",
                  background: "#dc2626", color: "#fff", cursor: loading ? "wait" : "pointer",
                  fontSize: ".8rem", fontWeight: 700,
                }}
              >
                {loading ? "Menghapus…" : "Ya, Hapus"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
