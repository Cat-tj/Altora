"use client";

import { useState } from "react";

type Table = {
  id: string;
  name: string;
  capacity: number;
  status: "AVAILABLE" | "OCCUPIED" | "RESERVED";
};

export default function MejaPage() {
  const [tables, setTables] = useState<Table[]>([
    { id: "1", name: "Meja 1", capacity: 2, status: "AVAILABLE" },
    { id: "2", name: "Meja 2", capacity: 4, status: "OCCUPIED" },
    { id: "3", name: "Meja 3", capacity: 4, status: "AVAILABLE" },
    { id: "4", name: "Meja 4", capacity: 6, status: "RESERVED" },
    { id: "5", name: "Meja 5", capacity: 2, status: "AVAILABLE" },
  ]);

  const [newTableName, setNewTableName] = useState("");
  const [newTableCapacity, setNewTableCapacity] = useState(2);

  const handleAddTable = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTableName.trim()) return;
    const newTable: Table = {
      id: Date.now().toString(),
      name: newTableName.trim(),
      capacity: Number(newTableCapacity),
      status: "AVAILABLE",
    };
    setTables([...tables, newTable]);
    setNewTableName("");
  };

  const handleToggleStatus = (id: string) => {
    setTables(
      tables.map((t) => {
        if (t.id !== id) return t;
        const nextStatus: Record<Table["status"], Table["status"]> = {
          AVAILABLE: "OCCUPIED",
          OCCUPIED: "RESERVED",
          RESERVED: "AVAILABLE",
        };
        return { ...t, status: nextStatus[t.status] };
      })
    );
  };

  return (
    <div className="market-stack">
      <div className="market-page-title">
        <div>
          <p>Layanan Restoran</p>
          <h1>Manajemen Meja</h1>
          <span>Kelola denah meja, kapasitas, dan status reservasi tamu.</span>
        </div>
      </div>

      <div className="market-content-grid" style={{ gridTemplateColumns: "2fr 1fr" }}>
        {/* Peta/Daftar Meja */}
        <section className="market-panel">
          <div className="market-panel-heading">
            <h2>Daftar Meja Aktif</h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: "1rem", marginTop: "1rem" }}>
            {tables.map((table) => {
              const statusColors = {
                AVAILABLE: { bg: "#e4f5ee", border: "#12a374", text: "#0e7a57" },
                OCCUPIED: { bg: "#eee9fd", border: "#7c5ce8", text: "#10224f" },
                RESERVED: { bg: "#fef2dc", border: "#f59e0b", text: "#d97706" },
              };
              const currentStyle = statusColors[table.status];

              return (
                <div
                  key={table.id}
                  onClick={() => handleToggleStatus(table.id)}
                  style={{
                    backgroundColor: currentStyle.bg,
                    borderColor: currentStyle.border,
                    borderWidth: "2px",
                    borderStyle: "solid",
                    borderRadius: "18px",
                    padding: "1.25rem",
                    cursor: "pointer",
                    transition: "transform 0.2s var(--ease)",
                    textAlign: "center",
                    boxShadow: "var(--sh-sm)",
                  }}
                  className="table-card-hover"
                >
                  <strong style={{ fontSize: "1.1rem", display: "block" }}>{table.name}</strong>
                  <span style={{ fontSize: "0.8rem", color: "var(--muted)", display: "block", marginTop: "0.25rem" }}>
                    Kapasitas: {table.capacity} Kursi
                  </span>
                  <span
                    style={{
                      display: "inline-block",
                      fontSize: "0.75rem",
                      fontWeight: "700",
                      marginTop: "0.75rem",
                      color: currentStyle.text,
                    }}
                  >
                    {table.status === "AVAILABLE" && "Tersedia"}
                    {table.status === "OCCUPIED" && "Terisi"}
                    {table.status === "RESERVED" && "Dipesan"}
                  </span>
                </div>
              );
            })}
          </div>
        </section>

        {/* Tambah Meja Form */}
        <section className="market-panel" style={{ height: "fit-content" }}>
          <div className="market-panel-heading">
            <h2>Tambah Meja Baru</h2>
          </div>
          <form onSubmit={handleAddTable} style={{ display: "grid", gap: "1rem", marginTop: "1rem" }}>
            <div>
              <label htmlFor="tableName" style={{ display: "block", fontSize: "0.875rem", fontWeight: "600", marginBottom: "0.5rem" }}>
                Nama Meja
              </label>
              <input
                id="tableName"
                type="text"
                placeholder="Contoh: Meja 6"
                value={newTableName}
                onChange={(e) => setNewTableName(e.target.value)}
                style={{
                  width: "100%",
                  height: "52px",
                  borderRadius: "999px",
                  border: "1px solid var(--line)",
                  padding: "0 1.25rem",
                  fontSize: "1rem",
                }}
                required
              />
            </div>
            <div>
              <label htmlFor="tableCapacity" style={{ display: "block", fontSize: "0.875rem", fontWeight: "600", marginBottom: "0.5rem" }}>
                Kapasitas Kursi
              </label>
              <select
                id="tableCapacity"
                value={newTableCapacity}
                onChange={(e) => setNewTableCapacity(Number(e.target.value))}
                style={{
                  width: "100%",
                  height: "52px",
                  borderRadius: "999px",
                  border: "1px solid var(--line)",
                  padding: "0 1.25rem",
                  fontSize: "1rem",
                  backgroundColor: "var(--surface)",
                }}
              >
                <option value={2}>2 Kursi</option>
                <option value={4}>4 Kursi</option>
                <option value={6}>6 Kursi</option>
                <option value={8}>8 Kursi</option>
              </select>
            </div>
            <button
              type="submit"
              style={{
                width: "100%",
                height: "52px",
                borderRadius: "999px",
                backgroundColor: "var(--accent)",
                color: "#fff",
                fontWeight: "700",
                border: "none",
                marginTop: "0.5rem",
                transition: "transform 0.2s var(--ease)",
              }}
              className="btn-purple-hover"
            >
              Simpan Meja
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
