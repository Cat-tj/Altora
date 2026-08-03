import { requireRole } from "../../../lib/market-authz";
import { listMarketMembers } from "../../../lib/market-members";
import { formatRupiah } from "../market-page-ui";

export default async function MemberPage() {
  const user = await requireRole(["OWNER", "MANAGER", "STAFF"]);
  const members = await listMarketMembers(user.tenantId);

  return (
    <div className="market-stack">
      <div className="market-page-title">
        <div>
          <p>Pelanggan & Promo</p>
          <h1>Database Member & Loyalitas</h1>
          <span>Kelola data pelanggan terdaftar, poin belanja, dan saldo deposit.</span>
        </div>
      </div>

      <div className="market-content-grid" style={{ gridTemplateColumns: "2fr 1fr" }}>
        {/* Daftar Member */}
        <section className="market-panel">
          <div className="market-panel-heading">
            <h2>Daftar Member Terdaftar</h2>
          </div>
          <div style={{ marginTop: "1rem" }}>
            {members.length === 0 ? (
              <p style={{ color: "var(--muted)", fontStyle: "italic", padding: "1rem 0" }}>
                Belum ada member terdaftar.
              </p>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid var(--line)" }}>
                    <th style={{ padding: "0.75rem 1rem", color: "var(--muted)" }}>Nama Member</th>
                    <th style={{ padding: "0.75rem 1rem", color: "var(--muted)" }}>No. Telepon</th>
                    <th style={{ padding: "0.75rem 1rem", color: "var(--muted)" }}>Poin</th>
                    <th style={{ padding: "0.75rem 1rem", color: "var(--muted)" }}>Saldo Deposit</th>
                  </tr>
                </thead>
                <tbody>
                  {members.map((m) => (
                    <tr key={m.id} style={{ borderBottom: "1px solid var(--line-2)" }}>
                      <td style={{ padding: "1rem", fontWeight: "700" }}>{m.name}</td>
                      <td style={{ padding: "1rem", color: "var(--muted)" }}>{m.phone}</td>
                      <td style={{ padding: "1rem", color: "var(--purple)", fontWeight: "700" }} className="num">
                        {m.points} pts
                      </td>
                      <td style={{ padding: "1rem", color: "var(--green)", fontWeight: "700" }} className="num">
                        {formatRupiah(m.depositBalance)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>

        {/* Form Registrasi Member */}
        <section className="market-panel" style={{ height: "fit-content" }}>
          <div className="market-panel-heading">
            <h2>Daftarkan Member Baru</h2>
          </div>
          <form action="/api/members" method="POST" style={{ display: "grid", gap: "1rem", marginTop: "1rem" }}>
            <div>
              <label htmlFor="name" style={{ display: "block", fontSize: "0.875rem", fontWeight: "600", marginBottom: "0.5rem" }}>
                Nama Lengkap
              </label>
              <input
                id="name"
                name="name"
                type="text"
                placeholder="Contoh: Andi Wijaya"
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
              <label htmlFor="phone" style={{ display: "block", fontSize: "0.875rem", fontWeight: "600", marginBottom: "0.5rem" }}>
                No. HP / WhatsApp
              </label>
              <input
                id="phone"
                name="phone"
                type="text"
                placeholder="0812..."
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
              <label htmlFor="email" style={{ display: "block", fontSize: "0.875rem", fontWeight: "600", marginBottom: "0.5rem" }}>
                Email (Opsional)
              </label>
              <input
                id="email"
                name="email"
                type="email"
                placeholder="nama@email.com"
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
              Simpan Member
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
