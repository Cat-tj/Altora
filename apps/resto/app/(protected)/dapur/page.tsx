"use client";

import { useState } from "react";

type KitchenItem = {
  id: string;
  orderId: string;
  tableName: string;
  productName: string;
  qty: number;
  notes?: string;
  status: "PENDING" | "COOKING" | "READY";
  minutesAgo: number;
};

export default function DapurPage() {
  const [items, setItems] = useState<KitchenItem[]>([
    { id: "k-1", orderId: "ORD-001", tableName: "Meja 2", productName: "Nasi Goreng Kampoeng", qty: 1, notes: "Pedas sedang", status: "PENDING", minutesAgo: 2 },
    { id: "k-2", orderId: "ORD-001", tableName: "Meja 2", productName: "Es Kopi Susu Aren", qty: 2, status: "PENDING", minutesAgo: 2 },
    { id: "k-3", orderId: "ORD-002", tableName: "Meja 4", productName: "Spaghetti Carbonara", qty: 1, status: "COOKING", minutesAgo: 8 },
    { id: "k-4", orderId: "ORD-002", tableName: "Meja 4", productName: "Croissant Almond", qty: 1, status: "COOKING", minutesAgo: 8 },
  ]);

  const handleAdvanceStatus = (id: string, nextStatus: KitchenItem["status"]) => {
    setItems(items.map((item) => (item.id === id ? { ...item, status: nextStatus } : item)));
  };

  return (
    <div className="market-stack">
      <div className="market-page-title">
        <div>
          <p>Layanan Dapur</p>
          <h1>Kitchen Display System (KDS)</h1>
          <span>Antrean live pesanan makanan dan minuman untuk bagian produksi dapur.</span>
        </div>
      </div>

      <div className="market-content-grid" style={{ gridTemplateColumns: "1fr 1fr" }}>
        {/* Kolom Menunggu Persiapan */}
        <section className="market-panel">
          <div className="market-panel-heading">
            <h2 style={{ color: "var(--amber)" }}>Menunggu Antrean ({items.filter(i => i.status === "PENDING").length})</h2>
          </div>
          <div style={{ display: "grid", gap: "1rem", marginTop: "1rem" }}>
            {items.filter(i => i.status === "PENDING").map((item) => (
              <div
                key={item.id}
                style={{
                  padding: "1.25rem",
                  backgroundColor: "var(--surface)",
                  border: "1px solid var(--line)",
                  borderRadius: "18px",
                  boxShadow: "var(--sh-sm)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "between", fontWeight: "700", marginBottom: "0.5rem" }}>
                  <span>{item.tableName}</span>
                  <span style={{ fontSize: "0.8rem", color: "var(--muted)" }}>{item.minutesAgo} mnt yang lalu</span>
                </div>
                <div style={{ fontSize: "1.1rem", fontWeight: "700" }}>
                  {item.qty}x {item.productName}
                </div>
                {item.notes && <p style={{ fontSize: "0.85rem", color: "var(--muted)", fontStyle: "italic" }}>&quot;{item.notes}&quot;</p>}
                <button
                  onClick={() => handleAdvanceStatus(item.id, "COOKING")}
                  style={{
                    marginTop: "1rem",
                    padding: "0.5rem 1rem",
                    borderRadius: "999px",
                    backgroundColor: "var(--accent)",
                    color: "#fff",
                    border: "none",
                    fontWeight: "700",
                    fontSize: "0.8rem",
                  }}
                >
                  Mulai Masak
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* Kolom Sedang Dimasak */}
        <section className="market-panel">
          <div className="market-panel-heading">
            <h2 style={{ color: "var(--purple)" }}>Sedang Dimasak ({items.filter(i => i.status === "COOKING").length})</h2>
          </div>
          <div style={{ display: "grid", gap: "1rem", marginTop: "1rem" }}>
            {items.filter(i => i.status === "COOKING").map((item) => (
              <div
                key={item.id}
                style={{
                  padding: "1.25rem",
                  backgroundColor: "var(--surface)",
                  border: "1px solid var(--line)",
                  borderRadius: "18px",
                  boxShadow: "var(--sh-sm)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "between", fontWeight: "700", marginBottom: "0.5rem" }}>
                  <span>{item.tableName}</span>
                  <span style={{ fontSize: "0.8rem", color: "var(--muted)" }}>{item.minutesAgo} mnt yang lalu</span>
                </div>
                <div style={{ fontSize: "1.1rem", fontWeight: "700" }}>
                  {item.qty}x {item.productName}
                </div>
                {item.notes && <p style={{ fontSize: "0.85rem", color: "var(--muted)", fontStyle: "italic" }}>&quot;{item.notes}&quot;</p>}
                <button
                  onClick={() => handleAdvanceStatus(item.id, "READY")}
                  style={{
                    marginTop: "1rem",
                    padding: "0.5rem 1rem",
                    borderRadius: "999px",
                    backgroundColor: "var(--green)",
                    color: "#fff",
                    border: "none",
                    fontWeight: "700",
                    fontSize: "0.8rem",
                  }}
                >
                  Selesai Memasak
                </button>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
