"use client";

import { useState } from "react";

const inputStyle: React.CSSProperties = {
  width: "100%",
  height: "52px",
  borderRadius: "999px",
  border: "1px solid var(--line)",
  padding: "0 1.25rem",
  fontSize: "1rem",
  boxSizing: "border-box",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "0.875rem",
  fontWeight: "600",
  marginBottom: "0.5rem",
  color: "var(--ink)",
};

export function PromoForm() {
  const [ruleType, setRuleType] = useState<"DISCOUNT" | "BOGO" | "BULK">("DISCOUNT");
  const [qualifyingQty, setQualifyingQty] = useState("2");
  const [rewardQty, setRewardQty] = useState("1");
  const [rewardDiscountPercent, setRewardDiscountPercent] = useState("100");

  return (
    <form action="/api/promos" method="POST" style={{ display: "grid", gap: "1rem", marginTop: "1rem" }}>
      <div>
        <label htmlFor="name" style={labelStyle}>Nama Promo</label>
        <input id="name" name="name" type="text" placeholder="Contoh: Beli 2 Gratis 1" style={inputStyle} required />
      </div>

      <div>
        <label htmlFor="ruleType" style={labelStyle}>Jenis Promo</label>
        <select id="ruleType" name="ruleType" value={ruleType} onChange={(e) => setRuleType(e.target.value as typeof ruleType)} style={inputStyle}>
          <option value="DISCOUNT">Diskon persen / nominal</option>
          <option value="BOGO">BOGO — beli N gratis M</option>
          <option value="BULK">BULK — beli banyak, item termurah diskon</option>
        </select>
      </div>

      {ruleType === "DISCOUNT" && (
        <>
          <div>
            <label htmlFor="discountPercent" style={labelStyle}>Diskon Persen (%)</label>
            <input id="discountPercent" name="discountPercent" type="number" placeholder="Contoh: 10" style={inputStyle} />
          </div>
          <div>
            <label htmlFor="discountAmount" style={labelStyle}>Diskon Nominal (Rp) — opsional</label>
            <input id="discountAmount" name="discountAmount" type="number" placeholder="Contoh: 5000" style={inputStyle} />
          </div>
        </>
      )}

      {(ruleType === "BOGO" || ruleType === "BULK") && (
        <>
          <div>
            <label htmlFor="qualifyingQty" style={labelStyle}>
              {ruleType === "BOGO" ? "Beli berapa item?" : "Minimal berapa item?"}
            </label>
            <input id="qualifyingQty" name="qualifyingQty" type="number" min={1} value={qualifyingQty} onChange={(e) => setQualifyingQty(e.target.value)} style={inputStyle} />
          </div>
          {ruleType === "BOGO" && (
            <>
              <div>
                <label htmlFor="rewardQty" style={labelStyle}>Gratis berapa item?</label>
                <input id="rewardQty" name="rewardQty" type="number" min={1} value={rewardQty} onChange={(e) => setRewardQty(e.target.value)} style={inputStyle} />
              </div>
              <div>
                <label htmlFor="rewardDiscountPercent" style={labelStyle}>Diskon item gratis (%) — 100 = gratis penuh</label>
                <input id="rewardDiscountPercent" name="rewardDiscountPercent" type="number" min={0} max={100} value={rewardDiscountPercent} onChange={(e) => setRewardDiscountPercent(e.target.value)} style={inputStyle} />
              </div>
            </>
          )}
          {ruleType === "BULK" && (
            <div>
              <label htmlFor="rewardDiscountPercent" style={labelStyle}>Diskon item termurah (%)</label>
              <input id="rewardDiscountPercent" name="rewardDiscountPercent" type="number" min={0} max={100} value={rewardDiscountPercent} onChange={(e) => setRewardDiscountPercent(e.target.value)} style={inputStyle} />
            </div>
          )}
        </>
      )}

      <div>
        <label htmlFor="minPurchase" style={labelStyle}>Minimal Belanja (Rp) — 0 = tanpa syarat</label>
        <input id="minPurchase" name="minPurchase" type="number" placeholder="0" style={inputStyle} />
      </div>

      <button type="submit" style={{ width: "100%", height: "52px", borderRadius: "999px", backgroundColor: "var(--accent)", color: "#fff", fontWeight: "700", border: "none", marginTop: "0.5rem", cursor: "pointer" }}>
        Simpan Promo
      </button>
    </form>
  );
}
