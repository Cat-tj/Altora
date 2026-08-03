import { requireRole } from "../../../lib/market-authz";
import { listMarketPromos } from "../../../lib/market-promos";
import { formatRupiah } from "../market-page-ui";

export default async function PromoPage() {
  const user = await requireRole(["OWNER", "MANAGER"]);
  const promos = await listMarketPromos(user.tenantId);

  return (
    <div className="market-stack">
      <div className="market-page-title">
        <div>
          <p>Pelanggan & Promo</p>
          <h1>Program Promo & Diskon</h1>
          <span>Kelola diskon otomatis, promo belanja minim, dan campaign diskon persentase/potongan harga.</span>
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
                    <th style={{ padding: "0.75rem 1rem", color: "var(--muted)" }}>Nilai Diskon</th>
                    <th style={{ padding: "0.75rem 1rem", color: "var(--muted)" }}>Min. Belanja</th>
                    <th style={{ padding: "0.75rem 1rem", color: "var(--muted)" }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {promos.map((p) => (
                    <tr key={p.id} style={{ borderBottom: "1px solid var(--line-2)" }}>
                      <td style={{ padding: "1rem", fontWeight: "700" }}>{p.name}</td>
                      <td style={{ padding: "1rem" }}>
                        {p.discountPercent ? `${p.discountPercent}%` : p.discountAmount ? formatRupiah(p.discountAmount) : "-"}
                      </td>
                      <td style={{ padding: "1rem" }} className="num">{formatRupiah(p.minPurchase)}</td>
                      <td style={{ padding: "1rem" }}>
                        <span
                          style={{
                            padding: "0.25rem 0.5rem",
                            borderRadius: "8px",
                            backgroundColor: p.isActive ? "#e4f5ee" : "#f1eef8",
                            color: p.isActive ? "#0e7a57" : "#6b7590",
                            fontSize: "0.75rem",
                            fontWeight: "700",
                          }}
                        >
                          {p.isActive ? "Aktif" : "Nonaktif"}
                        </span>
                      </td>
                    </tr>
                  ))}
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
          <form action="/api/promos" method="POST" style={{ display: "grid", gap: "1rem", marginTop: "1rem" }}>
            <div>
              <label htmlFor="name" style={{ display: "block", fontSize: "0.875rem", fontWeight: "600", marginBottom: "0.5rem" }}>
                Nama Promo
              </label>
              <input
                id="name"
                name="name"
                type="text"
                placeholder="Contoh: Promo Gajian 10%"
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
              <label htmlFor="discountPercent" style={{ display: "block", fontSize: "0.875rem", fontWeight: "600", marginBottom: "0.5rem" }}>
                Diskon Persen (%)
              </label>
              <input
                id="discountPercent"
                name="discountPercent"
                type="number"
                placeholder="Contoh: 10"
                style={{
                  width: "100%",
                  height: "52px",
                  borderRadius: "999px",
                  border: "1px solid var(--line)",
                  padding: "0 1.25rem",
                  fontSize: "1rem",
                }}
              />
            </div>

            <div>
              <label htmlFor="minPurchase" style={{ display: "block", fontSize: "0.875rem", fontWeight: "600", marginBottom: "0.5rem" }}>
                Minimal Belanja (Rp)
              </label>
              <input
                id="minPurchase"
                name="minPurchase"
                type="number"
                placeholder="0"
                style={{
                  width: "100%",
                  height: "52px",
                  borderRadius: "999px",
                  border: "1px solid var(--line)",
                  padding: "0 1.25rem",
                  fontSize: "1rem",
                }}
              />
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
              }}
            >
              Simpan Promo
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
