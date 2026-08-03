import { requireRole } from "../../../lib/market-authz";
import { listGiftCards } from "../../../lib/market-vouchers";
import { formatRupiah } from "../market-page-ui";

export default async function VoucherPage() {
  const user = await requireRole(["OWNER", "MANAGER"]);
  const cards = await listGiftCards(user.tenantId);

  return (
    <div className="market-stack">
      <div className="market-page-title">
        <div>
          <p>Pelanggan & Promo</p>
          <h1>Voucher & Gift Card</h1>
          <span>Terbitkan kode voucher belanja dan gift card saldo prabayar.</span>
        </div>
      </div>

      <section className="market-panel">
        <div className="market-panel-heading">
          <h2>Daftar Kode Voucher</h2>
        </div>
        <div style={{ marginTop: "1rem" }}>
          {cards.length === 0 ? (
            <p style={{ color: "var(--muted)", fontStyle: "italic", padding: "1rem 0" }}>
              Belum ada voucher diterbitkan.
            </p>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid var(--line)" }}>
                  <th style={{ padding: "0.75rem 1rem", color: "var(--muted)" }}>Kode Voucher</th>
                  <th style={{ padding: "0.75rem 1rem", color: "var(--muted)" }}>Nilai Awal</th>
                  <th style={{ padding: "0.75rem 1rem", color: "var(--muted)" }}>Sisa Saldo</th>
                  <th style={{ padding: "0.75rem 1rem", color: "var(--muted)" }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {cards.map((c) => (
                  <tr key={c.id} style={{ borderBottom: "1px solid var(--line-2)" }}>
                    <td style={{ padding: "1rem", fontWeight: "800", fontFamily: "var(--font-mono)", color: "var(--accent)" }}>
                      {c.code}
                    </td>
                    <td style={{ padding: "1rem" }} className="num">{formatRupiah(c.initialValue)}</td>
                    <td style={{ padding: "1rem", fontWeight: "700" }} className="num">{formatRupiah(c.balance)}</td>
                    <td style={{ padding: "1rem" }}>
                      <span
                        style={{
                          padding: "0.25rem 0.5rem",
                          borderRadius: "8px",
                          backgroundColor: c.isActive ? "#e4f5ee" : "#f1eef8",
                          color: c.isActive ? "#0e7a57" : "#6b7590",
                          fontSize: "0.75rem",
                          fontWeight: "700",
                        }}
                      >
                        {c.isActive ? "Aktif" : "Selesai / Nonaktif"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </div>
  );
}
