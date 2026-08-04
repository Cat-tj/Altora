"use client";
import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { formatRupiah } from "../../../lib/format";
import { XIcon } from "./icons";
import { getDynamicQrisAction } from "./actions";

export type PaymentMethod = "CASH" | "QRIS" | "TRANSFER" | "EWALLET" | "DEPOSIT" | "GIFT_CARD";

const PAYMENT_METHODS: { method: PaymentMethod; label: string; icon: string }[] = [
  { method: "CASH", label: "Tunai", icon: "💵" },
  { method: "QRIS", label: "QRIS", icon: "📱" },
  { method: "TRANSFER", label: "Transfer", icon: "🏦" },
  { method: "EWALLET", label: "E-Wallet", icon: "💳" },
  { method: "DEPOSIT", label: "Deposit", icon: "💰" },
  { method: "GIFT_CARD", label: "Gift Card", icon: "🎁" },
];

export function PaymentSheet({
  total, initialMember, onClose, onConfirm,
}: {
  total: number;
  initialMember: { id: string; name: string; depositBalance: number } | null;
  onClose: () => void;
  onConfirm: (payments: { method: PaymentMethod; amount: number }[], memberId?: string) => void;
}) {
  const [method, setMethod] = useState<PaymentMethod>("CASH");
  const [cashAmount, setCashAmount] = useState<string>("");
  const [payments, setPayments] = useState<{ method: PaymentMethod; amount: number }[]>([]);
  const [error, setError] = useState<string | null>(null);

  // QRIS dinamis state
  const [qris, setQris] = useState<{ payload: string; merchantName: string } | null>(null);
  const [qrisLoading, setQrisLoading] = useState(false);

  const currentPayment = payments.reduce((s, p) => s + p.amount, 0);
  const remaining = total - currentPayment;
  const isFullyPaid = currentPayment >= total;
  const change = method === "CASH" ? Math.max(0, (Number(cashAmount) || 0) - remaining) : 0;

  // Saat QRIS dipilih → minta payload dinamis dari server
  useEffect(() => {
    if (method !== "QRIS") return;
    let cancelled = false;
    setQrisLoading(true);
    setQris(null);
    getDynamicQrisAction(total).then((res) => {
      if (cancelled) return;
      setQrisLoading(false);
      if (res.error) setError(res.error);
      else setQris({ payload: res.payload!, merchantName: res.merchantName ?? "" });
    });
    return () => { cancelled = true; };
  }, [method, total]);

  function addPayment() {
    const amount = method === "CASH" ? Math.min(Number(cashAmount) || 0, remaining) : remaining;
    if (amount <= 0) return;
    setPayments((prev) => [...prev, { method, amount }]);
    setCashAmount("");
    setError(null);
  }

  function submit() {
    if (!isFullyPaid && method !== "CASH") {
      setError("Jumlah pembayaran belum mencukupi.");
      return;
    }
    const finalPayments = payments.length > 0 ? payments : [{ method, amount: total }];
    onConfirm(finalPayments, initialMember?.id);
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end sm:items-center sm:justify-center" style={{ backgroundColor: "rgba(0,0,0,0.4)" }}>
      <div className="max-h-[90vh] w-full overflow-y-auto rounded-t-2xl p-5 sm:max-w-md sm:rounded-2xl" style={{ backgroundColor: "var(--color-bg)" }}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold" style={{ color: "var(--color-text)" }}>Pembayaran</h2>
          <button onClick={onClose} className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ color: "var(--color-text-secondary)" }}>
            <XIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Total */}
        <div className="mb-4 rounded-xl p-4" style={{ backgroundColor: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
          <p className="text-xs" style={{ color: "var(--color-text-secondary)" }}>Total belanja</p>
          <p className="text-2xl font-bold tabular-nums" style={{ color: "var(--color-text)" }}>{formatRupiah(total)}</p>
          {initialMember && <p className="mt-1 text-xs" style={{ color: "var(--color-primary)" }}>👤 {initialMember.name}</p>}
        </div>

        {/* Method selector */}
        <div className="mb-4 grid grid-cols-3 gap-2">
          {PAYMENT_METHODS.map((pm) => (
            <button key={pm.method} onClick={() => { setMethod(pm.method); setError(null); }}
              className={`flex flex-col items-center gap-1 rounded-xl border p-3 text-xs font-semibold transiti` + `on-colors`}
              style={method === pm.method
                ? { borderColor: "var(--color-primary)", backgroundColor: "var(--color-primary)", color: "var(--color-on-primary)" }
                : { borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)", color: "var(--color-text)" }}>
              <span className="text-lg">{pm.icon}</span>
              {pm.label}
            </button>
          ))}
        </div>

        {/* QRIS dinamis */}
        {method === "QRIS" && (
          <div className="mb-4 flex flex-col items-center rounded-xl p-4 text-center" style={{ backgroundColor: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
            {qrisLoading && <p className="py-8 text-sm" style={{ color: "var(--color-text-secondary)" }}>Menyiapkan QRIS…</p>}
            {!qrisLoading && !qris && error && <p className="py-8 text-sm" style={{ color: "var(--color-warning-text)" }}>{error}</p>}
            {!qrisLoading && qris && (
              <>
                <div className="rounded-2xl bg-white p-4 shadow-sm">
                  <QRCodeSVG value={qris.payload} size={220} level="M" includeMargin />
                </div>
                <p className="mt-3 text-sm font-semibold" style={{ color: "var(--color-text)" }}>{qris.merchantName}</p>
                <p className="mt-1 text-lg font-bold tabular-nums" style={{ color: "var(--color-primary)" }}>{formatRupiah(total)}</p>
                <p className="mt-2 max-w-[260px] break-all rounded-lg bg-white/60 px-3 py-2 text-[10px] leading-tight" style={{ color: "var(--color-text-secondary)" }}>
                  {qris.payload}
                </p>
                <button onClick={submit} className="mt-3 flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl text-sm font-bold text-white hover:opacity-95 transition-opacity"
                  style={{ backgroundColor: "var(--color-primary)" }}>
                  ✅ Saya sudah menerima pembayaran
                </button>
                <p className="mt-2 text-[11px]" style={{ color: "var(--color-text-secondary)" }}>
                  Minta pelanggan scan &amp; bayar, lalu konfirmasi setelah dana masuk.
                </p>
              </>
            )}
          </div>
        )}

        {/* Cash input */}
        {method === "CASH" && (
          <div className="mb-4">
            <label className="mb-1 block text-xs font-semibold" style={{ color: "var(--color-text-secondary)" }}>Jumlah bayar</label>
            <input type="number" inputMode="numeric" value={cashAmount} onChange={(e) => setCashAmount(e.target.value)}
              placeholder={formatRupiah(remaining)} className="min-h-[48px] w-full rounded-lg border bg-white/70 px-4 text-base tabular-nums outline-none focus:ring-2"
              style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }} />
            {change > 0 && <p className="mt-2 text-sm font-semibold" style={{ color: "var(--color-good-text)" }}>Kembalian: {formatRupiah(change)}</p>}
          </div>
        )}

        {/* Add payment button for split */}
        {payments.length > 0 && (
          <div className="mb-3 space-y-1">
            {payments.map((p, i) => (
              <div key={i} className="flex items-center justify-between rounded-lg px-3 py-2 text-sm" style={{ backgroundColor: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
                <span>{PAYMENT_METHODS.find((m) => m.method === p.method)?.icon} {p.method}</span>
                <span className="font-bold tabular-nums">{formatRupiah(p.amount)}</span>
              </div>
            ))}
            <p className="text-right text-xs font-semibold" style={{ color: "var(--color-text-secondary)" }}>Sisa: {formatRupiah(Math.max(0, remaining))}</p>
          </div>
        )}

        {error && method !== "QRIS" && <p className="mb-3 rounded-lg px-4 py-3 text-sm" style={{ backgroundColor: "var(--color-warning-bg)", color: "var(--color-warning-text)" }}>{error}</p>}

        {/* Actions (non-QRIS) */}
        {method !== "QRIS" && (
          <div className="flex gap-2">
            {!isFullyPaid && remaining > 0 && method !== "CASH" && (
              <button onClick={addPayment} className="flex min-h-[52px] flex-1 items-center justify-center rounded-xl border text-sm font-semibold" style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}>
                + Tambah bayar
              </button>
            )}
            <button onClick={submit} disabled={!isFullyPaid && method !== "CASH"}
              className="flex min-h-[52px] flex-1 items-center justify-center gap-2 rounded-xl text-sm font-bold text-white disabled:opacity-40 hover:opacity-95 transition-opacity"
              style={{ backgroundColor: "var(--color-primary)" }}>
              {isFullyPaid ? "Selesaikan" : "Bayar"} {formatRupiah(isFullyPaid ? total : remaining)}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
