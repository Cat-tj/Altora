"use client";

import { useEffect, useRef, useState } from "react";
import type { MemberOption } from "./member-picker";

const money = (value: number) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(value);

export type PaymentMethod = "CASH" | "QRIS" | "TRANSFER" | "EWALLET" | "DEPOSIT" | "GIFT_CARD";
const METHODS: PaymentMethod[] = ["CASH", "QRIS", "TRANSFER", "EWALLET", "DEPOSIT", "GIFT_CARD"];
const METHOD_LABEL: Record<PaymentMethod, string> = {
  CASH: "Tunai",
  QRIS: "QRIS",
  TRANSFER: "Transfer",
  EWALLET: "E-Wallet",
  DEPOSIT: "Deposit",
  GIFT_CARD: "Voucher",
};

export function PaymentSheet({
  total,
  member,
  onClose,
  onConfirm,
}: {
  total: number;
  member: MemberOption | null;
  onClose: () => void;
  onConfirm: (payments: { method: PaymentMethod; amount: number }[], memberId?: string) => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [method, setMethod] = useState<PaymentMethod>("CASH");
  const [cashPaid, setCashPaid] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    dialogRef.current?.showModal();
  }, []);

  const amount = Number(cashPaid);
  const change = method === "CASH" && Number.isFinite(amount) ? Math.max(0, amount - total) : 0;
  const isDigital = method === "QRIS" || method === "TRANSFER" || method === "EWALLET" || method === "GIFT_CARD";

  function confirm() {
    setError(null);
    if (method === "DEPOSIT") {
      if (!member) {
        setError("Pilih member dulu untuk membayar dengan deposit.");
        return;
      }
      if (member.depositBalance < total) {
        setError(`Saldo deposit ${member.name} tidak cukup (tersedia ${money(member.depositBalance)}).`);
        return;
      }
      onConfirm([{ method: "DEPOSIT", amount: total }], member.id);
      onClose();
      return;
    }
    if (method === "CASH") {
      if (!Number.isFinite(amount) || amount < total) {
        setError("Uang tunai yang diterima kurang dari total tagihan.");
        return;
      }
      onConfirm([{ method: "CASH", amount }]);
      onClose();
      return;
    }
    // Digital / gift card: nominal harus sama persis
    onConfirm([{ method, amount: total }]);
    onClose();
  }

  return (
    <dialog ref={dialogRef} className="market-dialog" onClose={onClose}>
      <div className="market-dialog-body">
        <div>
          <h2>Pembayaran</h2>
          <p>Total tagihan {money(total)}.</p>
        </div>
        {member && (
          <p style={{ background: "#e8f4f1", borderRadius: ".55rem", padding: ".6rem .75rem", fontWeight: 700 }}>
            Member: {member.name} · Deposit {money(member.depositBalance)} · {member.points} poin
          </p>
        )}
        <fieldset style={{ border: 0, margin: 0, padding: 0, display: "grid", gap: ".4rem" }}>
          <legend style={{ fontWeight: 800, fontSize: ".9rem" }}>Metode</legend>
          <div style={{ display: "flex", flexWrap: "wrap", gap: ".4rem" }}>
            {METHODS.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => { setMethod(m); setError(null); }}
                aria-pressed={method === m}
                style={{
                  minHeight: "2.5rem",
                  border: `1px solid ${method === m ? "var(--market-accent, #0f6b5c)" : "#aebfbc"}`,
                  borderRadius: ".55rem",
                  padding: ".45rem .8rem",
                  fontWeight: 800,
                  cursor: "pointer",
                  background: method === m ? "#e8f4f1" : "#fff",
                  color: method === m ? "var(--market-accent, #0f6b5c)" : "var(--market-ink)",
                }}
              >
                {METHOD_LABEL[m]}
              </button>
            ))}
          </div>
        </fieldset>

        {method === "CASH" && (
          <label htmlFor="cash-paid">
            Uang diterima
            <input id="cash-paid" inputMode="numeric" value={cashPaid} onChange={(event) => setCashPaid(event.target.value)} placeholder="0" autoFocus />
          </label>
        )}
        {isDigital && <p style={{ color: "var(--market-muted)", fontSize: ".9rem" }}>Nominal otomatis {money(total)} — harus sama persis dengan tagihan.</p>}
        {method === "DEPOSIT" && !member && <p role="alert" className="market-form-error">Pilih member di kasir untuk membayar dengan deposit.</p>}
        {method === "GIFT_CARD" && <p style={{ color: "var(--market-muted)", fontSize: ".9rem" }}>Nominal voucher otomatis {money(total)}.</p>}

        {(method === "CASH" && Number.isFinite(amount) && amount >= total) && (
          <dl className="market-shift-summary">
            <div><dt>Total</dt><dd>{money(total)}</dd></div>
            <div><dt>Kembalian</dt><dd>{money(change)}</dd></div>
          </dl>
        )}

        {error && <p role="alert" className="market-form-error">{error}</p>}
        <div className="market-dialog-actions">
          <button type="button" onClick={onClose}>Batal</button>
          <button type="button" className="market-checkout-button" style={{ border: 0, color: "#fff", background: "var(--market-accent, #0f6b5c)" }} onClick={confirm}>Bayar {money(total)}</button>
        </div>
      </div>
    </dialog>
  );
}
