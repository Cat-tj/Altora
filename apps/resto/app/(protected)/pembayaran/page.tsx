"use client";

import { useState } from "react";

type Bill = {
  tableNumber: string;
  items: { name: string; qty: number; price: number }[];
  subtotal: number;
  tax: number;
  total: number;
};

export default function PembayaranPage() {
  const [activeBill, setActiveBill] = useState<Bill | null>({
    tableNumber: "Meja 2",
    items: [
      { name: "Es Kopi Susu Aren", qty: 2, price: 18000 },
      { name: "Nasi Goreng Kampoeng", qty: 1, price: 28000 },
    ],
    subtotal: 64000,
    tax: 6400,
    total: 70400,
  });

  const handleCheckout = (method: string) => {
    alert(`Pembayaran ${activeBill?.tableNumber} berhasil menggunakan ${method}!`);
    setActiveBill(null);
  };

  return (
    <div className="market-stack">
      <div className="market-page-title">
        <div>
          <p>Layanan Pembayaran</p>
          <h1>Kasir & Pembayaran Resto</h1>
          <span>Proses tagihan meja pelanggan dan cetak struk pembayaran.</span>
        </div>
      </div>

      <div className="market-content-grid" style={{ gridTemplateColumns: "1.5fr 1fr" }}>
        {/* Detail Tagihan Aktif */}
        <section className="market-panel">
          {activeBill ? (
            <div>
              <div className="market-panel-heading">
                <h2>Tagihan Aktif — {activeBill.tableNumber}</h2>
              </div>
              <div style={{ display: "grid", gap: "1rem", marginTop: "1rem" }}>
                {activeBill.items.map((item, idx) => (
                  <div key={idx} style={{ display: "flex", justifyContent: "between", fontSize: "0.95rem" }}>
                    <span style={{ flex: 1 }}>{item.qty}x {item.name}</span>
                    <span className="num">Rp{(item.price * item.qty).toLocaleString("id-ID")}</span>
                  </div>
                ))}
              </div>

              <div style={{ borderTop: "1px dashed var(--line-2)", marginTop: "1.5rem", paddingTop: "1rem", display: "grid", gap: "0.5rem" }}>
                <div style={{ display: "flex", justifyContent: "between", color: "var(--muted)" }}>
                  <span>Subtotal</span>
                  <span className="num">Rp{activeBill.subtotal.toLocaleString("id-ID")}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "between", color: "var(--muted)" }}>
                  <span>PB1 (Pajak Restoran 10%)</span>
                  <span className="num">Rp{activeBill.tax.toLocaleString("id-ID")}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "between", fontSize: "1.2rem", fontWeight: "800", borderTop: "1px solid var(--line)", paddingTop: "0.75rem", marginTop: "0.25rem" }}>
                  <span>Total Tagihan</span>
                  <span className="num" style={{ color: "var(--accent)" }}>Rp{activeBill.total.toLocaleString("id-ID")}</span>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ padding: "4rem 2rem", textAlign: "center" }}>
              <p>Tidak ada meja aktif yang membutuhkan pembayaran saat ini.</p>
            </div>
          )}
        </section>

        {/* Metode Pembayaran */}
        <section className="market-panel" style={{ height: "fit-content" }}>
          <div className="market-panel-heading">
            <h2>Pilih Metode Bayar</h2>
          </div>
          <div style={{ display: "grid", gap: "0.75rem", marginTop: "1rem" }} className="payment-options">
            <button
              onClick={() => handleCheckout("TUNAI")}
              disabled={!activeBill}
              style={{
                height: "52px",
                borderRadius: "999px",
                backgroundColor: "var(--green)",
                color: "#fff",
                fontWeight: "700",
                border: "none",
                fontSize: "1rem",
              }}
            >
              Tunai / Cash
            </button>
            <button
              onClick={() => handleCheckout("QRIS")}
              disabled={!activeBill}
              style={{
                height: "52px",
                borderRadius: "999px",
                backgroundColor: "var(--accent)",
                color: "#fff",
                fontWeight: "700",
                border: "none",
                fontSize: "1rem",
              }}
            >
              QRIS Dinamis
            </button>
            <button
              onClick={() => handleCheckout("DEPOSIT")}
              disabled={!activeBill}
              style={{
                height: "52px",
                borderRadius: "999px",
                backgroundColor: "var(--surface)",
                color: "var(--ink)",
                fontWeight: "700",
                border: "1px solid var(--line)",
                fontSize: "1rem",
              }}
            >
              Saldo Deposit Member
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
