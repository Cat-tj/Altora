"use client";

import { useState } from "react";

type Props = {
  enabled: boolean;
  mode: "auto" | "manual";
  days: number;
  percent: number;
};

export function ExpireDiscountSettings({ enabled, mode, days, percent }: Props) {
  const [isEnabled, setIsEnabled] = useState(enabled);
  const [discountMode, setDiscountMode] = useState<"auto" | "manual">(mode);
  const [discountDays, setDiscountDays] = useState(days);
  const [discountPercent, setDiscountPercent] = useState(percent);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<"idle" | "ok" | "err">("idle");

  async function save() {
    setSaving(true);
    setStatus("idle");
    try {
      const fd = new FormData();
      fd.set("expireDiscountEnabled", String(isEnabled));
      fd.set("expireDiscountMode", discountMode);
      fd.set("expireDiscountDays", String(discountDays));
      fd.set("expireDiscountPercent", String(discountPercent));
      // kirim juga field lain agar query UPDATE tidak null-in
      // (nilai kosong diterima & diabaikan server jika tidak ada perubahan)
      const res = await fetch("/api/settings/expire-discount", {
        method: "POST",
        body: fd,
      });
      if (res.ok) setStatus("ok");
      else setStatus("err");
    } catch {
      setStatus("err");
    } finally {
      setSaving(false);
    }
  }

  const accent = "#0e7a57";
  const accentLight = "#e4f5ee";

  return (
    <section
      className="market-panel"
      style={{ gridColumn: "1 / -1" }}
    >
      <div className="market-panel-heading">
        <div>
          <h2>🏷️ Diskon Produk Dekat Kadaluwarsa (Clearance)</h2>
          <p style={{ fontSize: "0.79rem", color: "var(--muted)", marginTop: "0.15rem" }}>
            Atur apakah sistem menerapkan diskon otomatis atau manual pada produk yang akan kadaluwarsa.
          </p>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "1.1rem", marginTop: "1rem" }}>
        {/* Toggle aktifkan */}
        <div
          style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "0.85rem 1rem", borderRadius: 12,
            background: isEnabled ? accentLight : "var(--surface)",
            border: `1.5px solid ${isEnabled ? accent : "var(--line)"}`,
            transition: "all 0.2s",
          }}
        >
          <div>
            <strong style={{ fontSize: "0.87rem", color: isEnabled ? accent : "var(--text)" }}>
              Aktifkan Diskon Clearance
            </strong>
            <p style={{ fontSize: "0.75rem", color: "var(--muted)", margin: "0.1rem 0 0" }}>
              {isEnabled ? "Diskon clearance aktif — produk dekat expire akan diberi label diskon." : "Nonaktif — tidak ada diskon otomatis / manual untuk produk expire."}
            </p>
          </div>
          {/* Switch toggle */}
          <button
            type="button"
            role="switch"
            aria-checked={isEnabled}
            onClick={() => setIsEnabled((v) => !v)}
            style={{
              flexShrink: 0,
              width: 48, height: 26, borderRadius: 999,
              background: isEnabled ? accent : "#d1d5db",
              border: "none", cursor: "pointer",
              position: "relative", transition: "background 0.2s",
            }}
          >
            <span
              style={{
                position: "absolute", top: 3,
                left: isEnabled ? 24 : 4,
                width: 20, height: 20, borderRadius: "50%",
                background: "#fff",
                boxShadow: "0 1px 4px rgba(0,0,0,0.18)",
                transition: "left 0.2s",
              }}
            />
          </button>
        </div>

        {/* Detail settings — tampil saat enabled */}
        {isEnabled && (
          <div
            style={{
              display: "grid", gridTemplateColumns: "1fr 1fr",
              gap: "0.85rem", padding: "1rem",
              borderRadius: 12, background: "var(--surface)",
              border: "1px solid var(--line)",
            }}
          >
            {/* Mode: Otomatis vs Manual */}
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--muted)", display: "block", marginBottom: "0.4rem" }}>
                MODE PENERAPAN DISKON
              </label>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                {(["auto", "manual"] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setDiscountMode(m)}
                    style={{
                      padding: "0.45rem 1rem",
                      borderRadius: 8,
                      fontSize: "0.82rem",
                      fontWeight: 700,
                      border: `1.5px solid ${discountMode === m ? accent : "var(--line)"}`,
                      background: discountMode === m ? accentLight : "transparent",
                      color: discountMode === m ? accent : "var(--muted)",
                      cursor: "pointer",
                      transition: "all 0.15s",
                    }}
                  >
                    {m === "auto" ? "🤖 Otomatis" : "✋ Manual"}
                  </button>
                ))}
              </div>
              <p style={{ fontSize: "0.72rem", color: "var(--muted)", marginTop: "0.4rem" }}>
                {discountMode === "auto"
                  ? "Otomatis: Diskon langsung diterapkan di kasir saat produk dekat expire tanpa input manual."
                  : "Manual: Kasir/owner perlu mengaktifkan diskon per-produk secara manual di katalog."}
              </p>
            </div>

            {/* Ambang hari */}
            <div>
              <label
                htmlFor="expire-days"
                style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--muted)", display: "block", marginBottom: "0.35rem" }}
              >
                DISKON BERLAKU ≤ X HARI SEBELUM EXPIRE
              </label>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <input
                  id="expire-days"
                  type="number"
                  min={1}
                  max={365}
                  value={discountDays}
                  onChange={(e) => setDiscountDays(Math.max(1, Math.min(365, Number(e.target.value))))}
                  style={{
                    width: "90px", padding: "0.4rem 0.6rem",
                    borderRadius: 8, border: "1.5px solid var(--line)",
                    fontSize: "0.9rem", fontWeight: 700, textAlign: "center",
                    fontFamily: "var(--font-mono)",
                    background: "var(--bg)",
                  }}
                />
                <span style={{ fontSize: "0.82rem", color: "var(--muted)" }}>hari sebelum tanggal kadaluwarsa</span>
              </div>
              {/* Slider visual */}
              <input
                type="range"
                min={1}
                max={180}
                value={Math.min(discountDays, 180)}
                onChange={(e) => setDiscountDays(Number(e.target.value))}
                style={{ width: "100%", marginTop: "0.4rem", accentColor: accent }}
              />
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.68rem", color: "var(--muted)" }}>
                <span>1 hari</span><span>30 hari</span><span>60 hari</span><span>90 hari</span><span>180 hari</span>
              </div>
            </div>

            {/* Persentase diskon */}
            <div>
              <label
                htmlFor="expire-percent"
                style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--muted)", display: "block", marginBottom: "0.35rem" }}
              >
                BESAR DISKON CLEARANCE (%)
              </label>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <input
                  id="expire-percent"
                  type="number"
                  min={1}
                  max={100}
                  value={discountPercent}
                  onChange={(e) => setDiscountPercent(Math.max(1, Math.min(100, Number(e.target.value))))}
                  style={{
                    width: "90px", padding: "0.4rem 0.6rem",
                    borderRadius: 8, border: "1.5px solid var(--line)",
                    fontSize: "0.9rem", fontWeight: 700, textAlign: "center",
                    fontFamily: "var(--font-mono)",
                    background: "var(--bg)",
                  }}
                />
                <span style={{ fontSize: "0.82rem", color: "var(--muted)" }}>% potongan harga jual</span>
              </div>
              {/* Slider visual */}
              <input
                type="range"
                min={1}
                max={100}
                value={discountPercent}
                onChange={(e) => setDiscountPercent(Number(e.target.value))}
                style={{ width: "100%", marginTop: "0.4rem", accentColor: accent }}
              />
              {/* Quick presets */}
              <div style={{ display: "flex", gap: "0.35rem", marginTop: "0.5rem", flexWrap: "wrap" }}>
                {[10, 15, 20, 25, 30, 50].map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setDiscountPercent(p)}
                    style={{
                      padding: "0.2rem 0.55rem", borderRadius: 6,
                      fontSize: "0.72rem", fontWeight: 700,
                      border: `1px solid ${discountPercent === p ? accent : "var(--line)"}`,
                      background: discountPercent === p ? accentLight : "transparent",
                      color: discountPercent === p ? accent : "var(--muted)",
                      cursor: "pointer",
                    }}
                  >
                    {p}%
                  </button>
                ))}
              </div>
            </div>

            {/* Preview kalkulasi */}
            <div
              style={{
                gridColumn: "1 / -1",
                padding: "0.75rem 1rem", borderRadius: 10,
                background: "#fffbeb", border: "1px solid #fde68a",
                fontSize: "0.78rem", color: "#92400e",
                display: "flex", gap: "0.75rem", alignItems: "center",
              }}
            >
              <span style={{ fontSize: "1.2rem" }}>💡</span>
              <span>
                Contoh: Produk seharga <strong>Rp 10.000</strong> yang expire dalam ≤{" "}
                <strong>{discountDays} hari</strong> akan{" "}
                {discountMode === "auto" ? "otomatis " : "bisa "}
                dijual seharga{" "}
                <strong>
                  Rp {Math.round(10000 * (1 - discountPercent / 100)).toLocaleString("id-ID")}
                </strong>{" "}
                (diskon <strong>{discountPercent}%</strong>).
              </span>
            </div>
          </div>
        )}

        {/* Tombol simpan */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <button
            type="button"
            onClick={save}
            disabled={saving}
            style={{
              padding: "0.6rem 1.4rem",
              borderRadius: 10, border: "none",
              background: accent, color: "#fff",
              fontWeight: 700, fontSize: "0.84rem",
              cursor: saving ? "not-allowed" : "pointer",
              opacity: saving ? 0.7 : 1,
              transition: "opacity 0.15s",
            }}
          >
            {saving ? "Menyimpan…" : "Simpan Pengaturan Diskon"}
          </button>
          {status === "ok" && (
            <span style={{ color: accent, fontSize: "0.8rem", fontWeight: 600 }}>
              ✓ Tersimpan
            </span>
          )}
          {status === "err" && (
            <span style={{ color: "#dc2626", fontSize: "0.8rem", fontWeight: 600 }}>
              ✗ Gagal menyimpan
            </span>
          )}
        </div>
      </div>
    </section>
  );
}
