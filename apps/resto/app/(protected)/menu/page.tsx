"use client";

import { useState } from "react";

type MenuItem = {
  id: string;
  name: string;
  price: number;
  category: string;
  hasRecipe: boolean;
};

export default function MenuPage() {
  const [menus] = useState<MenuItem[]>([
    { id: "m-1", name: "Es Kopi Susu Aren", price: 18000, category: "Minuman Coffee", hasRecipe: true },
    { id: "m-2", name: "Nasi Goreng Kampoeng", price: 28000, category: "Makanan Utama", hasRecipe: true },
    { id: "m-3", name: "Croissant Almond", price: 20000, category: "Pastry", hasRecipe: false },
    { id: "m-4", name: "Caffe Latte", price: 22000, category: "Minuman Coffee", hasRecipe: true },
  ]);

  return (
    <div className="market-stack">
      <div className="market-page-title">
        <div>
          <p>Menu & Resep</p>
          <h1>Manajemen Menu F&B</h1>
          <span>Kelola daftar menu jual, kategori, resep racikan, dan modifier.</span>
        </div>
      </div>

      <section className="market-panel">
        <div className="market-panel-heading">
          <h2>Daftar Menu Tersedia</h2>
        </div>

        <div style={{ marginTop: "1rem" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
            <thead>
              <tr style={{ borderBottom: "2px solid var(--line)" }}>
                <th style={{ padding: "0.75rem 1rem", color: "var(--muted)" }}>Nama Menu</th>
                <th style={{ padding: "0.75rem 1rem", color: "var(--muted)" }}>Kategori</th>
                <th style={{ padding: "0.75rem 1rem", color: "var(--muted)" }}>Harga</th>
                <th style={{ padding: "0.75rem 1rem", color: "var(--muted)" }}>Status Resep</th>
              </tr>
            </thead>
            <tbody>
              {menus.map((menu) => (
                <tr key={menu.id} style={{ borderBottom: "1px solid var(--line-2)" }}>
                  <td style={{ padding: "1rem", fontWeight: "700" }}>{menu.name}</td>
                  <td style={{ padding: "1rem" }}>{menu.category}</td>
                  <td style={{ padding: "1rem" }} className="num">Rp{menu.price.toLocaleString("id-ID")}</td>
                  <td style={{ padding: "1rem" }}>
                    <span
                      style={{
                        padding: "0.25rem 0.5rem",
                        borderRadius: "8px",
                        backgroundColor: menu.hasRecipe ? "#e4f5ee" : "#fdeaec",
                        color: menu.hasRecipe ? "#0e7a57" : "#ef4444",
                        fontSize: "0.75rem",
                        fontWeight: "700",
                      }}
                    >
                      {menu.hasRecipe ? "Ada Resep" : "Bahan Langsung"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
