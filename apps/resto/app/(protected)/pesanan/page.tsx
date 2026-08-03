"use client";

import { useState } from "react";

type OrderItem = {
  name: string;
  qty: number;
  price: number;
  notes?: string;
};

type Order = {
  id: string;
  tableNumber: string;
  items: OrderItem[];
  status: "PENDING" | "PREPARING" | "READY" | "COMPLETED";
  total: number;
};

export default function PesananPage() {
  const [orders, setOrders] = useState<Order[]>([
    {
      id: "ORD-001",
      tableNumber: "Meja 2",
      items: [
        { name: "Es Kopi Susu Aren", qty: 2, price: 18000 },
        { name: "Nasi Goreng Kampoeng", qty: 1, price: 28000, notes: "Pedas sedang" },
      ],
      status: "PENDING",
      total: 64000,
    },
    {
      id: "ORD-002",
      tableNumber: "Meja 4",
      items: [
        { name: "Caffe Latte", qty: 1, price: 22000 },
        { name: "Spaghetti Carbonara", qty: 1, price: 35000 },
        { name: "Croissant Almond", qty: 1, price: 20000 },
      ],
      status: "PREPARING",
      total: 77000,
    },
    {
      id: "ORD-003",
      tableNumber: "Meja 1",
      items: [
        { name: "Americano Ice", qty: 1, price: 16000 },
      ],
      status: "READY",
      total: 16000,
    },
  ]);

  const handleUpdateStatus = (id: string, nextStatus: Order["status"]) => {
    setOrders(
      orders.map((o) => (o.id === id ? { ...o, status: nextStatus } : o))
    );
  };

  const getStatusBadge = (status: Order["status"]) => {
    const styles = {
      PENDING: { bg: "#fef2dc", text: "#d97706", label: "Antrean Masuk" },
      PREPARING: { bg: "#eee9fd", text: "#7c5ce8", label: "Dimasak" },
      READY: { bg: "#e4f5ee", text: "#0e7a57", label: "Siap Sajikan" },
      COMPLETED: { bg: "#f1eef8", text: "#6b7590", label: "Selesai" },
    };
    const s = styles[status];
    return (
      <span
        style={{
          padding: "0.25rem 0.75rem",
          borderRadius: "999px",
          backgroundColor: s.bg,
          color: s.text,
          fontSize: "0.75rem",
          fontWeight: "700",
        }}
      >
        {s.label}
      </span>
    );
  };

  return (
    <div className="market-stack">
      <div className="market-page-title">
        <div>
          <p>Layanan Restoran</p>
          <h1>Daftar Pesanan</h1>
          <span>Kelola dan pantau seluruh pesanan aktif pelanggan.</span>
        </div>
      </div>

      <section className="market-panel">
        <div className="market-panel-heading">
          <h2>Antrean Pesanan Aktif</h2>
        </div>

        <div style={{ display: "grid", gap: "1.25rem", marginTop: "1rem" }}>
          {orders.map((order) => (
            <div
              key={order.id}
              style={{
                backgroundColor: "var(--surface)",
                border: "1px solid var(--line)",
                borderRadius: "26px",
                padding: "1.5rem",
                boxShadow: "var(--sh-sm)",
                display: "flex",
                flexDirection: "column",
                gap: "1rem",
              }}
            >
              <div style={{ display: "flex", justifyContent: "between", alignItems: "center", width: "100%", flexWrap: "wrap", gap: "1rem" }}>
                <div style={{ flex: 1 }}>
                  <strong style={{ fontSize: "1.1rem" }}>{order.tableNumber}</strong>
                  <span style={{ fontSize: "0.85rem", color: "var(--muted)", marginLeft: "0.5rem" }}>
                    ID: {order.id}
                  </span>
                </div>
                <div>{getStatusBadge(order.status)}</div>
              </div>

              <div style={{ borderTop: "1px solid var(--line-2)", paddingTop: "1rem" }}>
                {order.items.map((item, idx) => (
                  <div key={idx} style={{ display: "flex", justifyContent: "between", fontSize: "0.95rem", marginBottom: "0.5rem" }}>
                    <span style={{ flex: 1 }}>
                      <strong>{item.qty}x</strong> {item.name}
                      {item.notes && (
                        <span style={{ display: "block", fontSize: "0.8rem", color: "var(--muted)", fontStyle: "italic", marginTop: "0.15rem" }}>
                          &quot;{item.notes}&quot;
                        </span>
                      )}
                    </span>
                    <span className="num">Rp{(item.price * item.qty).toLocaleString("id-ID")}</span>
                  </div>
                ))}
              </div>

              <div style={{ borderTop: "1px dashed var(--line-2)", paddingTop: "1rem", display: "flex", justifyContent: "between", alignItems: "center", fontWeight: "700" }}>
                <span>Total Pesanan</span>
                <span className="num">Rp{order.total.toLocaleString("id-ID")}</span>
              </div>

              <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem" }}>
                {order.status === "PENDING" && (
                  <button
                    onClick={() => handleUpdateStatus(order.id, "PREPARING")}
                    style={{ padding: "0.75rem 1.25rem", borderRadius: "999px", backgroundColor: "var(--accent)", color: "#fff", fontWeight: "700", border: "none", fontSize: "0.85rem" }}
                  >
                    Mulai Masak
                  </button>
                )}
                {order.status === "PREPARING" && (
                  <button
                    onClick={() => handleUpdateStatus(order.id, "READY")}
                    style={{ padding: "0.75rem 1.25rem", borderRadius: "999px", backgroundColor: "var(--accent)", color: "#fff", fontWeight: "700", border: "none", fontSize: "0.85rem" }}
                  >
                    Siap Sajikan
                  </button>
                )}
                {order.status === "READY" && (
                  <button
                    onClick={() => handleUpdateStatus(order.id, "COMPLETED")}
                    style={{ padding: "0.75rem 1.25rem", borderRadius: "999px", backgroundColor: "var(--green)", color: "#fff", fontWeight: "700", border: "none", fontSize: "0.85rem" }}
                  >
                    Selesaikan Pesanan
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
