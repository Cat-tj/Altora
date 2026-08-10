"use client";

import { useActionState, useEffect, useId, useRef, useState } from "react";
import { openMarketShiftAction } from "./actions";

export function OpenShiftForm({
  outlets,
}: {
  outlets: { id: string; name: string; suggestedOpeningCash: number | null }[];
}) {
  const [state, action, pending] = useActionState(
    async (_: { error?: string; success?: true }, formData: FormData) =>
      openMarketShiftAction(formData),
    {}
  );
  const errorId = useId();
  const errorRef = useRef<HTMLParagraphElement>(null);

  const firstOutlet = outlets[0];
  const fallback = firstOutlet?.suggestedOpeningCash ?? 0;
  const [openingCash, setOpeningCash] = useState<number>(fallback);

  useEffect(() => {
    if (state.error) errorRef.current?.focus();
  }, [state.error]);

  if (!firstOutlet) {
    return (
      <div className="market-open-shift-wrap">
        <section className="market-open-shift-card" aria-labelledby="shift-title">
          <div className="market-open-shift-header">
            <div className="market-open-shift-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="4" width="20" height="16" rx="2" />
                <path d="M6 8h12" />
                <path d="M6 12h8" />
              </svg>
            </div>
            <div className="market-open-shift-title-group">
              <h1 id="shift-title">Buka Shift Kasir</h1>
              <p>Belum ada outlet yang dapat Anda akses. Hubungi pemilik toko.</p>
            </div>
          </div>
        </section>
      </div>
    );
  }

  const formattedSuggested = new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(fallback);

  const presets = [0, 50000, 100000, 200000, 500000];

  return (
    <div className="market-open-shift-wrap">
      <section className="market-open-shift-card" aria-labelledby="shift-title">
        {/* Header */}
        <div className="market-open-shift-header">
          <div className="market-open-shift-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
          </div>
          <div className="market-open-shift-title-group">
            <h1 id="shift-title">Buka Shift Kasir</h1>
            <p>Masukkan modal awal laci kasir sebelum mulai berjualan.</p>
          </div>
        </div>

        {/* Form */}
        <form action={action} className="market-open-shift-form">
          {/* Outlet Selection */}
          <div className="market-field-group">
            <label htmlFor="outletId" className="market-field-label">
              <span>Lokasi Outlet</span>
            </label>
            <select
              id="outletId"
              name="outletId"
              defaultValue={firstOutlet.id}
              className="market-select-styled"
            >
              {outlets.map((outlet) => (
                <option key={outlet.id} value={outlet.id}>
                  {outlet.name}
                </option>
              ))}
            </select>
          </div>

          {/* Modal Awal Input */}
          <div className="market-field-group">
            <label htmlFor="openingCash" className="market-field-label">
              <span>Modal Awal Kasir</span>
              <span style={{ fontSize: "0.72rem", color: "var(--muted)", fontWeight: 500 }}>
                Uang fisik laci
              </span>
            </label>
            <div className="market-input-prefix-group">
              <span className="market-input-prefix">Rp</span>
              <input
                id="openingCash"
                name="openingCash"
                type="number"
                min="0"
                step="1"
                value={openingCash}
                onChange={(e) => setOpeningCash(Number(e.target.value) || 0)}
                className="market-input-styled"
                aria-describedby={state.error ? errorId : undefined}
                aria-invalid={Boolean(state.error)}
                required
              />
            </div>

            {/* Quick Presets */}
            <div className="market-preset-grid">
              {presets.map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setOpeningCash(amt)}
                  className="market-preset-btn"
                >
                  {amt === 0
                    ? "Rp 0"
                    : `Rp ${(amt / 1000).toLocaleString("id-ID")}k`}
                </button>
              ))}
            </div>
          </div>

          {/* Shift Suggestion Hint Box */}
          <div className="market-hint-box">
            <svg
              className="market-hint-icon"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
            <div>
              <strong>Petunjuk:</strong> Gunakan hasil hitung kas fisik di laci.
              Saran dari shift terakhir: <strong>{formattedSuggested}</strong>.
            </div>
          </div>

          {/* Error & Success Feedback */}
          {state.error ? (
            <p
              id={errorId}
              ref={errorRef}
              className="market-form-error"
              role="alert"
              tabIndex={-1}
            >
              {state.error}
            </p>
          ) : null}

          {state.success ? (
            <p className="market-form-success" role="status">
              ✓ Shift berhasil dibuka! Menyiapkan antarmuka kasir…
            </p>
          ) : null}

          {/* Submit Button */}
          <button
            className="market-btn-submit"
            disabled={pending}
            type="submit"
          >
            {pending ? (
              <>
                <svg
                  className="animate-spin"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
                  <path d="M12 2a10 10 0 0 1 10 10" strokeOpacity="0.75" />
                </svg>
                Membuka Shift...
              </>
            ) : (
              <>
                Buka Shift Sekarang
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </>
            )}
          </button>
        </form>
      </section>
    </div>
  );
}
