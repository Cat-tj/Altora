"use client";

import { useActionState, useEffect, useId, useRef } from "react";
import { openMarketShiftAction } from "./actions";

export function OpenShiftForm({ outlets }: { outlets: { id: string; name: string; suggestedOpeningCash: number | null }[] }) {
  const [state, action, pending] = useActionState(async (_: { error?: string; success?: true }, formData: FormData) => openMarketShiftAction(formData), {});
  const errorId = useId();
  const errorRef = useRef<HTMLParagraphElement>(null);
  useEffect(() => { if (state.error) errorRef.current?.focus(); }, [state.error]);
  const firstOutlet = outlets[0];
  if (!firstOutlet) return <section className="market-panel" aria-labelledby="shift-title"><h1 id="shift-title">Buka shift kasir</h1><p>Belum ada outlet yang dapat Anda akses. Hubungi pemilik toko.</p></section>;
  const fallback = firstOutlet.suggestedOpeningCash ?? 0;
  return <section className="market-panel market-open-shift" aria-labelledby="shift-title"><p className="market-eyebrow">Kasir</p><h1 id="shift-title">Buka shift</h1><p>Masukkan modal awal laci kasir sebelum mulai berjualan.</p><form action={action}><label htmlFor="outletId">Outlet</label><select id="outletId" name="outletId" defaultValue={firstOutlet.id}>{outlets.map((outlet) => <option key={outlet.id} value={outlet.id}>{outlet.name}</option>)}</select><label htmlFor="openingCash">Modal awal</label><input id="openingCash" name="openingCash" type="number" min="0" step="1" defaultValue={fallback} aria-describedby={state.error ? errorId : undefined} aria-invalid={Boolean(state.error)} required /><p className="market-field-hint">Gunakan hasil hitung kas fisik. Saran dari shift terakhir: {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(fallback)}.</p>{state.error ? <p id={errorId} ref={errorRef} className="market-form-error" role="alert" tabIndex={-1}>{state.error}</p> : null}{state.success ? <p className="market-form-success" role="status">Shift dibuka. Menyiapkan kasir…</p> : null}<button className="market-checkout-button" disabled={pending} type="submit">{pending ? "Membuka shift…" : "Buka shift"}</button></form></section>;
}
