"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

const inputStyle: React.CSSProperties = {
  width: "100%",
  height: 44,
  padding: "0 12px",
  borderRadius: 8,
  border: "1px solid var(--line)",
  background: "var(--bg-alt, #fafafa)",
  fontSize: "0.9rem",
};

const overlayStyle: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.45)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 9999,
  padding: "1rem",
};

const modalStyle: React.CSSProperties = {
  background: "var(--surface, #fff)",
  borderRadius: 12,
  width: "100%",
  maxWidth: 440,
  maxHeight: "90vh",
  overflow: "auto",
  padding: "1.5rem",
  boxShadow: "0 12px 40px rgba(0,0,0,0.18)",
};

export default function TransferFormModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const [outlets, setOutlets] = useState<{ id: string; name: string }[]>([]);
  const [products, setProducts] = useState<{ id: string; name: string }[]>([]);
  const [fromOutlet, setFromOutlet] = useState("");
  const [toOutlet, setToOutlet] = useState("");
  const [product, setProduct] = useState("");
  const [qty, setQty] = useState(1);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!open) return;
    setError("");
    fetch("/api/products").then(r => r.json()).then(d => {
      if (d.products) setProducts(d.products.map((p: { id: string; name: string }) => ({ id: p.id, name: p.name })));
    }).catch(() => {});
    // outlets from settings
    fetch("/api/settings/business").then(r => r.json()).then(d => {
      if (d.outlets) setOutlets(d.outlets.map((o: { id: string; name: string }) => ({ id: o.id, name: o.name })));
    }).catch(() => {});
  }, [open]);

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!fromOutlet || !toOutlet || !product || qty <= 0) {
      setError("Semua field wajib diisi.");
      return;
    }
    if (fromOutlet === toOutlet) {
      setError("Outlet asal dan tujuan tidak boleh sama.");
      return;
    }
    setPending(true);
    setError("");
    try {
      const res = await fetch("/api/products", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "transfer", fromOutletId: fromOutlet, toOutletId: toOutlet, productId: product, qty }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setError(data.error || "Gagal menyimpan transfer.");
        setPending(false);
        return;
      }
      onClose();
      router.refresh();
    } catch {
      setError("Gagal mengirim data.");
      setPending(false);
    }
  }

  return (
    <div style={overlayStyle} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={modalStyle}>
        <h2 style={{ margin: "0 0 1rem", fontSize: "1.1rem", fontWeight: 700 }}>Transfer Stok Baru</h2>
        <form ref={formRef} onSubmit={handleSubmit} style={{ display: "grid", gap: "0.8rem" }}>
          <div>
            <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: 4 }}>Dari Outlet</label>
            <select value={fromOutlet} onChange={(e) => setFromOutlet(e.target.value)} style={inputStyle}>
              <option value="">Pilih outlet asal</option>
              {outlets.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
            </select>
          </div>
          <div>
            <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: 4 }}>Ke Outlet</label>
            <select value={toOutlet} onChange={(e) => setToOutlet(e.target.value)} style={inputStyle}>
              <option value="">Pilih outlet tujuan</option>
              {outlets.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
            </select>
          </div>
          <div>
            <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: 4 }}>Produk</label>
            <select value={product} onChange={(e) => setProduct(e.target.value)} style={inputStyle}>
              <option value="">Pilih produk</option>
              {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: 4 }}>Jumlah</label>
            <input type="number" min={1} value={qty} onChange={(e) => setQty(Number(e.target.value))} style={inputStyle} />
          </div>
          {error && <p style={{ color: "#dc2626", fontSize: "0.85rem", margin: 0 }}>{error}</p>}
          <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem" }}>
            <button type="submit" disabled={pending} style={{
              flex: 1, height: 40, borderRadius: 8, border: "none", background: "var(--accent)", color: "#fff",
              fontWeight: 700, fontSize: "0.85rem", cursor: pending ? "not-allowed" : "pointer",
            }}>
              {pending ? "Menyimpan…" : "Simpan Transfer"}
            </button>
            <button type="button" onClick={onClose} style={{
              height: 40, padding: "0 1rem", borderRadius: 8, border: "1px solid var(--line)",
              background: "transparent", fontWeight: 600, fontSize: "0.85rem", cursor: "pointer",
            }}>
              Batal
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
