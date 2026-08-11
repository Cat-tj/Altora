import { requireRole } from "../../../lib/market-authz";
import { getTenantSettings, listOutlets, listStaff } from "../../../lib/market-settings";
import { SettingsFormClient } from "./settings-form-client";

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
          <SettingsFormClient
            taxPercent={settings?.taxPercent || 0}
            receiptFooter={settings?.receiptFooter || "Terima kasih telah berbelanja di toko kami!"}
            initialQrisPayload={settings?.staticQrisPayload ?? ""}
          />
        </section>

        {/* Panel Daftar Outlet / Cabang */}
        <section className="market-panel">
          <div className="market-panel-heading">
            <h2>Daftar Outlet & Cabang</h2>
          </div>
          <div style={{ display: "grid", gap: "0.5rem", marginTop: "0.7rem" }}>
            {outlets.map((outlet) => (
              <div
                key={outlet.id}
                style={{
                  padding: "0.6rem 0.75rem", borderRadius: 10,
                  border: "1px solid var(--line)", backgroundColor: "var(--surface)",
                }}
              >
                <strong style={{ fontSize: "0.8rem", display: "block" }}>{outlet.name}</strong>
                <span style={{ fontSize: "0.7rem", color: "var(--muted)", display: "block", marginTop: "0.15rem" }}>
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
        <div style={{ marginTop: "0.7rem" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.78rem" }}>
            <thead>
              <tr style={{ borderBottom: "2px solid var(--line)" }}>
                <th style={{ padding: "0.5rem 0.6rem", color: "var(--muted)", fontSize: "0.7rem" }}>Nama</th>
                <th style={{ padding: "0.5rem 0.6rem", color: "var(--muted)", fontSize: "0.7rem" }}>Email / HP</th>
                <th style={{ padding: "0.5rem 0.6rem", color: "var(--muted)", fontSize: "0.7rem" }}>Role</th>
                <th style={{ padding: "0.5rem 0.6rem", color: "var(--muted)", fontSize: "0.7rem" }}>PIN</th>
              </tr>
            </thead>
            <tbody>
              {staffList.map((staf) => (
                <tr key={staf.id} style={{ borderBottom: "1px solid var(--line)" }}>
                  <td style={{ padding: "0.5rem 0.6rem", fontWeight: "700" }}>{staf.name}</td>
                  <td style={{ padding: "0.5rem 0.6rem", color: "var(--muted)" }}>{staf.email || staf.phone || "-"}</td>
                  <td style={{ padding: "0.5rem 0.6rem" }}>
                    <span style={{
                      padding: "0.15rem 0.4rem", borderRadius: 6,
                      backgroundColor: staf.role === "OWNER" ? "#eee9fd" : "#e4f5ee",
                      color: staf.role === "OWNER" ? "#7c5ce8" : "#0e7a57",
                      fontSize: "0.65rem", fontWeight: "700",
                    }}>
                      {staf.role}
                    </span>
                  </td>
                  <td style={{ padding: "0.5rem 0.6rem", fontFamily: "var(--font-mono)", fontSize: "0.75rem" }}>
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
