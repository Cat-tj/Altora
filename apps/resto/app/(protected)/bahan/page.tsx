"use client";

import { useState } from "react";

type Ingredient = {
  id: string;
  name: string;
  stock: number;
  unit: string;
  status: "NORMAL" | "LOW" | "OUT";
};

export default function BahanBakuPage() {
  const [ingredients] = useState<Ingredient[]>([
    { id: "i-1", name: "Biji Kopi Arabica", stock: 12.5, unit: "Kg", status: "NORMAL" },
    { id: "i-2", name: "Susu Segar UHT", stock: 4, unit: "Liter", status: "LOW" },
    { id: "i-3", name: "Sirup Gula Aren", stock: 0.8, unit: "Liter", status: "LOW" },
    { id: "i-4", name: "Spaghetti Raw", stock: 0, unit: "Kg", status: "OUT" },
    { id: "i-5", name: "Daging Asap / Smoked Beef", stock: 1.5, unit: "Kg", status: "NORMAL" },
  ]);

  return (
    <div className="market-stack">
      <div className="market-page-title">
        <div>
          <p>Menu & Stok</p>
          <h1>Stok Bahan Baku</h1>
          <span>Pantau ketersediaan bahan baku mentah dan racikan resep untuk menu F&B.</span>
        </div>
      </div>

      <section className="market-panel">
        <div className="market-panel-heading">
          <h2>Daftar Bahan Baku</h2>
        </div>

        <div style={{ marginTop: "1rem" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
            <thead>
              <tr style={{ borderBottom: "2px solid var(--line)" }}>
                <th style={{ padding: "0.75rem 1rem", color: "var(--muted)" }}>Nama Bahan</th>
                <th style={{ padding: "0.75rem 1rem", color: "var(--muted)" }}>Sisa Stok</th>
                <th style={{ padding: "0.75rem 1rem", color: "var(--muted)" }}>Satuan</th>
                <th style={{ padding: "0.75rem 1rem", color: "var(--muted)" }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {ingredients.map((ing) => {
                const statusStyles = {
                  NORMAL: { bg: "#e4f5ee", color: "#0e7a57", label: "Aman" },
                  LOW: { bg: "#fef2dc", color: "#d97706", label: "Menipis" },
                  OUT: { bg: "#fdeaec", color: "#ef4444", label: "Habis" },
                };
                const style = statusStyles[ing.status];

                return (
                  <tr key={ing.id} style={{ borderBottom: "1px solid var(--line-2)" }}>
                    <td style={{ padding: "1rem", fontWeight: "700" }}>{ing.name}</td>
                    <td style={{ padding: "1rem" }} className="num">{ing.stock}</td>
                    <td style={{ padding: "1rem" }}>{ing.unit}</td>
                    <td style={{ padding: "1rem" }}>
                      <span
                        style={{
                          padding: "0.25rem 0.5rem",
                          borderRadius: "8px",
                          backgroundColor: style.bg,
                          color: style.color,
                          fontSize: "0.75rem",
                          fontWeight: "700",
                        }}
                      >
                        {style.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
