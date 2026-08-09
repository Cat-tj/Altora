import { requireRole } from "../../../lib/market-authz";
import { listMarketPromos } from "../../../lib/market-promos";
import { formatRupiah } from "../market-page-ui";
import { PromoForm } from "./promo-form";

function ruleLabel(rule: string | null): string {
  switch ((rule ?? "DISCOUNT").toUpperCase()) {
    case "BOGO":
    case "BUY_X_GET_Y": return "BOGO";
    case "BULK": return "BULK";
    default: return "Diskon";
  }
}

export default async function PromoPage({
  searchParams,
}: {
  searchParams: Promise<{ created?: string }>;
}) {
  const { created } = await searchParams;
  const user = await requireRole(["OWNER", "MANAGER"]);
  const promos = await listMarketPromos(user.tenantId);

  return (
    <div className="market-stack">
      {created && (
        <div style={{ padding: "0.75rem 1rem", borderRadius: "12px", backgroundColor: "#e4f5ee", color: "#0e7a57", fontWeight: "600", fontSize: "0.9rem" }}>
          ✅ Promo berhasil dibuat. Promo otomatis aktif di kasir.
        </div>
      )}
      <div className="market-page-title">
        <div>
          <p>Pelanggan & Promo</p>
          <h1>Program Promo & Diskon</h1>
          <span>Kelola diskon otomatis, BOGO (beli N gratis M), dan diskon belanja minimum.</span>
        </div>
      </div>

      <div className="market-content-grid" style={{ gridTemplateColumns: "2fr 1fr" }}>
        {/* Daftar Promo */}
        <section className="market-panel">
          <div className="market-panel-heading">
            <h2>Daftar Campaign Promo</h2>
          </div>
          <div style={{ marginTop: "1rem" }}>
            {promos.length === 0 ? (
              <p style={{ color: "var(--muted)", fontStyle: "italic", padding: "1rem 0" }}>
                Belum ada promo aktif.
              </p>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid var(--line)" }}>
                    <th style={{ padding: "0.75rem 1rem", color: "var(--muted)" }}>Nama Promo</th>
                    <th style={{ padding: "0.75rem 1rem", color: "var(--muted)" }}>Tipe</th>
                    <th style={{ padding: "0.75rem 1rem", color: "var(--muted)" }}>Nilai</th>
                    <th style={{ padding: "0.75rem 1rem", color: "var(--muted)" }}>Min. Belanja</th>
                    <th style={{ padding: "0.75rem 1rem", color: "var(--muted)" }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {promos.map((p) => {
                    let value = "-";
                    const pRule = (p.ruleType ?? "DISCOUNT").toUpperCase();
                    if (pRule === "BOGO" || pRule === "BUY_X_GET_Y") {
                      value = `Beli ${p.qualifyingQty ?? 2} Gratis ${p.rewardQty ?? 1}${p.rewardDiscountPercent != null && p.rewardDiscountPercent < 100 ? ` (${p.rewardDiscountPercent}%)` : ""}`;
                    } else if ((p.ruleType ?? "DISCOUNT").toUpperCase() === "BULK") {
                      value = `Beli ${p.qualifyingQty ?? 5}+ · item termurah ${p.rewardDiscountPercent ?? 10}%`;
                    } else if (p.discountPercent) {
                      value = `${p.discountPercent}%`;
                    } else if (p.discountAmount) {
                      value = formatRupiah(p.discountAmount);
                    }
                    return (
                      <tr key={p.id} style={{ borderBottom: "1px solid var(--line-2)" }}>
                        <td style={{ padding: "1rem", fontWeight: "700" }}>{p.name}</td>
                        <td style={{ padding: "1rem" }}>
                          <span style={{ padding: "0.25rem 0.5rem", borderRadius: "8px", backgroundColor: "#f1eef8", color: "#6b7590", fontSize: "0.75rem", fontWeight: "700" }}>
                            {ruleLabel(p.ruleType)}
                          </span>
                        </td>
                        <td style={{ padding: "1rem" }}>{value}</td>
                        <td style={{ padding: "1rem" }} className="num">{formatRupiah(p.minPurchase)}</td>
                        <td style={{ padding: "1rem" }}>
                          <span style={{ padding: "0.25rem 0.5rem", borderRadius: "8px", backgroundColor: p.isActive ? "#e4f5ee" : "#f1eef8", color: p.isActive ? "#0e7a57" : "#6b7590", fontSize: "0.75rem", fontWeight: "700" }}>
                            {p.isActive ? "Aktif" : "Nonaktif"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </section>

        {/* Form Buat Promo */}
        <section className="market-panel" style={{ height: "fit-content" }}>
          <div className="market-panel-heading">
            <h2>Buat Promo Baru</h2>
          </div>
          <PromoForm />
        </section>
      </div>
    </div>
  );
}
