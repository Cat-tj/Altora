"use client";

import { useEffect, useMemo, useRef, useState } from "react";

export type MemberOption = { id: string; name: string; phone: string; points: number; depositBalance: number };

const money = (value: number) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(value);

export function MemberPicker({
  members,
  onClose,
  onSelect,
}: {
  members: MemberOption[];
  onClose: () => void;
  onSelect: (member: MemberOption) => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    dialogRef.current?.showModal();
  }, []);

  const visible = useMemo(
    () => members.filter((m) => `${m.name} ${m.phone}`.toLowerCase().includes(query.toLowerCase())).slice(0, 20),
    [members, query],
  );

  return (
    <dialog ref={dialogRef} className="market-dialog" onClose={onClose}>
      <div className="market-dialog-body">
        <div>
          <h2>Pilih member</h2>
          <p>Cari nama atau nomor HP. Member dipakai untuk pembayaran deposit dan akumulasi poin.</p>
        </div>
        <label htmlFor="member-search">Cari member</label>
        <input id="member-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Nama atau nomor HP" autoFocus autoComplete="off" />
        <div style={{ display: "grid", gap: ".4rem", maxHeight: "18rem", overflowY: "auto" }}>
          {visible.length === 0 && (
            <div style={{ display: "grid", gap: ".5rem", padding: ".5rem 0" }}>
              <p style={{ color: "var(--market-muted)", margin: 0 }}>
                {query ? `Tidak ada member "${query}"` : "Belum ada member terdaftar."}
              </p>
              <a
                href="/member"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: ".4rem",
                  minHeight: "2.4rem",
                  padding: ".45rem .9rem",
                  border: "1px solid var(--market-teal)",
                  borderRadius: ".55rem",
                  background: "var(--market-teal)",
                  color: "#fff",
                  fontWeight: 800,
                  fontSize: ".82rem",
                  textDecoration: "none",
                  cursor: "pointer",
                }}
              >
                + Buat member baru
              </a>
            </div>
          )}
          {visible.map((member) => (
            <button
              key={member.id}
              type="button"
              onClick={() => { onSelect(member); onClose(); }}
              style={{ display: "flex", alignItems: "center", gap: ".6rem", border: "1px solid #aebfbc", borderRadius: ".55rem", padding: ".6rem .75rem", background: "#fff", cursor: "pointer", textAlign: "left" }}
            >
              <span style={{ flex: 1 }}>
                <strong style={{ display: "block" }}>{member.name}</strong>
                <small style={{ color: "var(--market-muted)" }}>{member.phone}</small>
              </span>
              <span style={{ textAlign: "right", fontSize: ".8rem", color: "var(--market-muted)" }}>
                Deposit {money(member.depositBalance)}
                <br />
                {member.points} poin
              </span>
            </button>
          ))}
        </div>
        <div className="market-dialog-actions">
          <button type="button" onClick={onClose}>Batal</button>
        </div>
      </div>
    </dialog>
  );
}
