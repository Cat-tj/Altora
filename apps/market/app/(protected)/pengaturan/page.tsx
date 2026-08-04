import { requireRole } from "../../../lib/market-authz";
import { getTenantSettings, listOutlets, listStaff } from "../../../lib/market-settings";

export default async function PengaturanPage() {
  const user = await requireRole(["OWNER"]);
  const settings = await getTenantSettings(user.tenantId);
  const outlets = await listOutlets(user.tenantId);
  const staffList = await listStaff(user.tenantId);

  return (
    <div className="market-stack">
      <div className="market-page-title">
        <div>
          <p>Pengaturan & Konfigurasi</p>
          <h1>Pengaturan Toko & Outlet</h1>
          <span>Kelola profil bisnis, footer cetak struk, daftar outlet cabang, dan akses staf.</span>
        </div>
      </div>

      <div className="market-content-grid" style={{ gridTemplateColumns: "1fr 1fr" }}>
        {/* Panel Profil Bisnis & Struk */}
        <section className="market-panel">
          <div className="market-panel-heading">
            <h2>Profil Toko & Format Struk</h2>
          </div>
          <form action="/api/settings/business" method="POST" style={{ display: "grid", gap: "1rem", marginTop: "1rem" }}>
            <div>
              <label htmlFor="taxPercent" style={{ display: "block", fontSize: "0.875rem", fontWeight: "600", marginBottom: "0.5rem" }}>
                Pajak Penjualan (%)
              </label>
              <input
                id="taxPercent"
                name="taxPercent"
                type="number"
                defaultValue={settings?.taxPercent || 0}
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
              <label htmlFor="receiptFooter" style={{ display: "block", fontSize: "0.875rem", fontWeight: "600", marginBottom: "0.5rem" }}>
                Pesan Footer Struk Belanja
              </label>
              <textarea
                id="receiptFooter"
                name="receiptFooter"
                rows={3}
                defaultValue={settings?.receiptFooter || "Terima kasih telah berbelanja di toko kami!"}
                style={{
                  width: "100%",
                  borderRadius: "18px",
                  border: "1px solid var(--line)",
                  padding: "1rem 1.25rem",
                  fontSize: "1rem",
                }}
              />
            </div>

            <div>
              <label htmlFor="staticQrisPayload" style={{ display: "block", fontSize: "0.875rem", fontWeight: "600", marginBottom: "0.5rem" }}>
                Payload QRIS Statis (untuk QRIS dinamis di kasir)
              </label>
              <textarea
                id="staticQrisPayload"
                name="staticQrisPayload"
                rows={3}
                defaultValue={settings?.staticQrisPayload ?? ""}
                placeholder="Tempel string QRIS statis dari bank/aggregator (contoh: 0002010102112657…6304XXXX)"
                style={{
                  width: "100%",
                  borderRadius: "18px",
                  border: "1px solid var(--line)",
                  padding: "1rem 1.25rem",
                  fontSize: "0.9rem",
                  fontFamily: "monospace",
                }}
              />
              <p style={{ fontSize: "0.8rem", color: "var(--ink-2)", marginTop: "0.35rem" }}>
                Kasir memilih QRIS → sistem membuat QR dinamis berisi nominal transaksi otomatis.
              </p>
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
              }}
            >
              Simpan Pengaturan Bisnis
            </button>
          </form>
        </section>

        {/* Panel Daftar Outlet / Cabang */}
        <section className="market-panel">
          <div className="market-panel-heading">
            <h2>Daftar Outlet & Cabang</h2>
          </div>
          <div style={{ display: "grid", gap: "0.75rem", marginTop: "1rem" }}>
            {outlets.map((outlet) => (
              <div
                key={outlet.id}
                style={{
                  padding: "1rem 1.25rem",
                  borderRadius: "18px",
                  border: "1px solid var(--line)",
                  backgroundColor: "var(--surface)",
                }}
              >
                <strong style={{ fontSize: "1rem", display: "block" }}>{outlet.name}</strong>
                <span style={{ fontSize: "0.85rem", color: "var(--muted)", display: "block", marginTop: "0.25rem" }}>
                  {outlet.address || "Alamat belum diatur"} — {outlet.phone || "No HP belum diatur"}
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Panel Daftar Staf & Akses */}
      <section className="market-panel">
        <div className="market-panel-heading">
          <h2>Daftar Pengguna & Akses Staf</h2>
        </div>
        <div style={{ marginTop: "1rem" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
            <thead>
              <tr style={{ borderBottom: "2px solid var(--line)" }}>
                <th style={{ padding: "0.75rem 1rem", color: "var(--muted)" }}>Nama Staf</th>
                <th style={{ padding: "0.75rem 1rem", color: "var(--muted)" }}>Email / No HP</th>
                <th style={{ padding: "0.75rem 1rem", color: "var(--muted)" }}>Peran (Role)</th>
                <th style={{ padding: "0.75rem 1rem", color: "var(--muted)" }}>PIN Kasir</th>
              </tr>
            </thead>
            <tbody>
              {staffList.map((staf) => (
                <tr key={staf.id} style={{ borderBottom: "1px solid var(--line-2)" }}>
                  <td style={{ padding: "1rem", fontWeight: "700" }}>{staf.name}</td>
                  <td style={{ padding: "1rem", color: "var(--muted)" }}>{staf.email || staf.phone || "-"}</td>
                  <td style={{ padding: "1rem" }}>
                    <span
                      style={{
                        padding: "0.25rem 0.5rem",
                        borderRadius: "8px",
                        backgroundColor: staf.role === "OWNER" ? "#eee9fd" : "#e4f5ee",
                        color: staf.role === "OWNER" ? "#7c5ce8" : "#0e7a57",
                        fontSize: "0.75rem",
                        fontWeight: "700",
                      }}
                    >
                      {staf.role}
                    </span>
                  </td>
                  <td style={{ padding: "1rem", fontFamily: "var(--font-mono)" }}>
                    {staf.pin ? "****" : "Belum diatur"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
