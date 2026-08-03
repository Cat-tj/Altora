"use client";

import { use, useState } from "react";

type MenuItem = {
  id: string;
  name: string;
  price: number;
  category: string;
};

export default function CustomerQrOrderPage({ params }: { params: Promise<{ qrToken: string }> }) {
  const { qrToken } = use(params);

  const [cart, setCart] = useState<{ id: string; name: string; price: number; qty: number }[]>([]);
  const [submitted, setSubmitted] = useState(false);

  const menus: MenuItem[] = [
    { id: "m-1", name: "Es Kopi Susu Aren", price: 18000, category: "Minuman Coffee" },
    { id: "m-2", name: "Nasi Goreng Kampoeng", price: 28000, category: "Makanan Utama" },
    { id: "m-3", name: "Croissant Almond", price: 20000, category: "Pastry" },
    { id: "m-4", name: "Caffe Latte", price: 22000, category: "Minuman Coffee" },
  ];

  const addToCart = (item: MenuItem) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing) {
        return prev.map((i) => (i.id === item.id ? { ...i, qty: i.qty + 1 } : i));
      }
      return [...prev, { id: item.id, name: item.name, price: item.price, qty: 1 }];
    });
  };

  const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);

  const handleOrder = () => {
    if (cart.length === 0) return;
    setSubmitted(true);
  };

  return (
    <div style={{ maxWidth: "480px", margin: "0 auto", padding: "1rem", minHeight: "100dvh", backgroundColor: "var(--paper)" }}>
      <header style={{ textAlign: "center", padding: "1rem 0" }}>
        <p style={{ margin: 0, color: "var(--accent)", fontWeight: "800", fontSize: "0.8rem", letterSpacing: "0.1em" }}>
          ALTORA RESTO DINE-IN
        </p>
        <h1 style={{ margin: "0.25rem 0", fontSize: "1.5rem" }}>Pesan dari Meja Anda</h1>
        <p style={{ margin: 0, color: "var(--muted)", fontSize: "0.85rem" }}>QR Token: {qrToken.slice(0, 8)}...</p>
      </header>

      {submitted ? (
        <div style={{ backgroundColor: "var(--surface)", border: "1px solid var(--line)", borderRadius: "26px", padding: "2rem", textAlign: "center", marginTop: "2rem" }}>
          <h2 style={{ color: "var(--green)", fontSize: "1.5rem", margin: "0 0 0.5rem" }}>Pesanan Berhasil Dikirim!</h2>
          <p style={{ color: "var(--muted)", fontSize: "0.95rem" }}>
            Tim dapur kami sedang menyiapkan hidangan Anda. Silakan bersantai di meja.
          </p>
          <button
            onClick={() => {
              setCart([]);
              setSubmitted(false);
            }}
            style={{
              marginTop: "1.5rem",
              padding: "0.75rem 1.5rem",
              borderRadius: "999px",
              backgroundColor: "var(--accent)",
              color: "#fff",
              border: "none",
              fontWeight: "700",
            }}
          >
            Pesan Tambahan
          </button>
        </div>
      ) : (
        <div style={{ display: "grid", gap: "1.25rem", marginTop: "1rem" }}>
          <section style={{ backgroundColor: "var(--surface)", border: "1px solid var(--line)", borderRadius: "26px", padding: "1.25rem" }}>
            <h2 style={{ fontSize: "1.1rem", margin: "0 0 1rem" }}>Pilih Menu</h2>
            <div style={{ display: "grid", gap: "0.75rem" }}>
              {menus.map((menu) => (
                <div
                  key={menu.id}
                  style={{
                    display: "flex",
                    justifyContent: "between",
                    alignItems: "center",
                    padding: "0.85rem",
                    border: "1px solid var(--line-2)",
                    borderRadius: "18px",
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <strong style={{ display: "block", fontSize: "0.95rem" }}>{menu.name}</strong>
                    <span className="num" style={{ fontSize: "0.85rem", color: "var(--accent)", fontWeight: "700" }}>
                      Rp{menu.price.toLocaleString("id-ID")}
                    </span>
                  </div>
                  <button
                    onClick={() => addToCart(menu)}
                    style={{
                      padding: "0.4rem 0.85rem",
                      borderRadius: "999px",
                      backgroundColor: "var(--accent)",
                      color: "#fff",
                      border: "none",
                      fontWeight: "700",
                      fontSize: "0.8rem",
                    }}
                  >
                    + Tambah
                  </button>
                </div>
              ))}
            </div>
          </section>

          {cart.length > 0 && (
            <section style={{ backgroundColor: "var(--surface)", border: "1px solid var(--line)", borderRadius: "26px", padding: "1.25rem" }}>
              <h2 style={{ fontSize: "1.1rem", margin: "0 0 1rem" }}>Keranjang Pesanan</h2>
              <div style={{ display: "grid", gap: "0.5rem" }}>
                {cart.map((item) => (
                  <div key={item.id} style={{ display: "flex", justifyContent: "between", fontSize: "0.9rem" }}>
                    <span>{item.qty}x {item.name}</span>
                    <span className="num">Rp{(item.price * item.qty).toLocaleString("id-ID")}</span>
                  </div>
                ))}
              </div>
              <div style={{ borderTop: "1px solid var(--line)", marginTop: "1rem", paddingTop: "0.75rem", display: "flex", justifyContent: "between", fontWeight: "800", fontSize: "1.1rem" }}>
                <span>Total</span>
                <span className="num" style={{ color: "var(--accent)" }}>Rp{total.toLocaleString("id-ID")}</span>
              </div>
              <button
                onClick={handleOrder}
                style={{
                  width: "100%",
                  height: "52px",
                  borderRadius: "999px",
                  backgroundColor: "var(--green)",
                  color: "#fff",
                  fontWeight: "800",
                  border: "none",
                  marginTop: "1rem",
                  fontSize: "1rem",
                }}
              >
                Kirim Pesanan ke Dapur
              </button>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
