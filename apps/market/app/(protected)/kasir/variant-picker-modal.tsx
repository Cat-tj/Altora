"use client";

import { useEffect, useMemo, useRef, useState } from "react";

export type VariantOption = { id: string; name: string; priceDelta: number };
export type VariantGroup = { id: string; name: string; type: "SINGLE" | "MULTIPLE"; required: boolean; options: VariantOption[] };

const money = (value: number) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(value);

export function VariantPickerModal({
  productName,
  basePrice,
  groups,
  onClose,
  onConfirm,
}: {
  productName: string;
  basePrice: number;
  groups: VariantGroup[];
  onClose: () => void;
  onConfirm: (result: { optionIds: string[]; priceDelta: number; label: string | null }) => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [selected, setSelected] = useState<Record<string, string[]>>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    dialogRef.current?.showModal();
  }, []);

  function toggle(group: VariantGroup, optionId: string) {
    setError(null);
    setSelected((prev) => {
      const current = prev[group.id] ?? [];
      if (group.type === "SINGLE") return { ...prev, [group.id]: current.includes(optionId) ? [] : [optionId] };
      const next = current.includes(optionId) ? current.filter((id) => id !== optionId) : [...current, optionId];
      return { ...prev, [group.id]: next };
    });
  }

  const allOptionIds = useMemo(() => Object.values(selected).flat(), [selected]);
  const priceDelta = groups
    .flatMap((group) => group.options)
    .filter((option) => allOptionIds.includes(option.id))
    .reduce((sum, option) => sum + option.priceDelta, 0);
  const total = basePrice + priceDelta;

  function confirm() {
    for (const group of groups) {
      if (group.required && (selected[group.id] ?? []).length === 0) {
        setError(`Pilih ${group.name} dulu.`);
        return;
      }
    }
    const label = groups
      .flatMap((group) => group.options)
      .filter((option) => allOptionIds.includes(option.id))
      .map((option) => option.name)
      .join(" + ");
    onConfirm({ optionIds: allOptionIds, priceDelta, label: label || null });
    onClose();
  }

  return (
    <dialog ref={dialogRef} className="market-dialog" onClose={onClose}>
      <div className="market-dialog-body">
        <div>
          <h2>{productName}</h2>
          <p>Pilih varian yang diinginkan. Harga dapat berubah sesuai pilihan.</p>
        </div>
        {groups.map((group) => (
          <fieldset key={group.id} style={{ border: 0, margin: 0, padding: 0, display: "grid", gap: ".4rem" }}>
            <legend style={{ fontWeight: 800, fontSize: ".9rem" }}>
              {group.name}
              {group.required ? " (wajib)" : " (opsional)"}
            </legend>
            <div style={{ display: "grid", gap: ".4rem" }}>
              {group.options.map((option) => {
                const checked = (selected[group.id] ?? []).includes(option.id);
                return (
                  <label key={option.id} style={{ display: "flex", alignItems: "center", gap: ".6rem", border: "1px solid #aebfbc", borderRadius: ".55rem", padding: ".6rem .75rem", background: checked ? "#e8f4f1" : "#fff", cursor: "pointer" }}>
                    <input type="checkbox" checked={checked} onChange={() => toggle(group, option.id)} />
                    <span style={{ flex: 1, fontWeight: 700 }}>{option.name}</span>
                    {option.priceDelta > 0 && <span style={{ color: "var(--market-muted)", fontWeight: 800 }}>+{money(option.priceDelta)}</span>}
                  </label>
                );
              })}
            </div>
          </fieldset>
        ))}
        <dl className="market-shift-summary">
          <div>
            <dt>Harga produk</dt>
            <dd>{money(basePrice)}</dd>
          </div>
          <div>
            <dt>Total</dt>
            <dd style={{ fontWeight: 900, fontSize: "1.1rem" }}>{money(total)}</dd>
          </div>
        </dl>
        {error && <p role="alert" className="market-form-error">{error}</p>}
        <div className="market-dialog-actions">
          <button type="button" onClick={onClose}>Batal</button>
          <button type="button" className="market-checkout-button" style={{ border: 0, color: "#fff", background: "var(--market-accent, #0f6b5c)" }} onClick={confirm}>Tambahkan</button>
        </div>
      </div>
    </dialog>
  );
}
