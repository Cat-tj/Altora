import { auth } from "../../../auth";
import { redirect } from "next/navigation";
import {
  getRestoTenantSettings,
  getRestoOutlets,
} from "@altora/pengaturan/resto-settings";

export const dynamic = "force-dynamic";

export default async function PengaturanPage() {
  const session = await auth();
  const user = session?.user as
    | { id: string; tenantId: string; role: "OWNER" | "MANAGER" | "STAFF" }
    | undefined;

  if (!user?.tenantId) redirect("/login");

  const [settings, outlets] = await Promise.all([
    getRestoTenantSettings(user.tenantId),
    getRestoOutlets(user.tenantId),
  ]);

  return (
    <div className="market-stack">
      <div className="market-page-title">
        <div>
          <p>Pengaturan</p>
          <h1>Pengaturan Restoran</h1>
          <span>Kelola pengaturan tenant, outlet, dan konfigurasi struk.</span>
        </div>
      </div>

      <div className="market-content-grid" style={{ gridTemplateColumns: "1fr 1fr" }}>
        {/* Pengaturan Bisnis */}
        <section className="market-panel">
          <div className="market-panel-heading">
            <h2>Informasi Bisnis</h2>
          </div>
          <form
            action="/api/settings/business"
            method="POST"
            style={{ display: "grid", gap: "1rem", marginTop: "1rem" }}
          >
            <div>
              <label style={{ display: "block", fontSize: "0.875rem", fontWeight: "600", marginBottom: "0.5rem" }}>
                Nama Bisnis
              </label>
              <input
                name="businessName"
                type="text"
                defaultValue={settings?.businessName ?? ""}
                placeholder="Nama restoran Anda"
                style={{
                  width: "100%",
                  height: "48px",
                  borderRadius: "12px",
                  border: "1px solid var(--line)",
                  padding: "0 1rem",
                  fontSize: "0.95rem",
                }}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "0.875rem", fontWeight: "600", marginBottom: "0.5rem" }}>
                Alamat
              </label>
              <input
                name="businessAddress"
                type="text"
                defaultValue={settings?.businessAddress ?? ""}
                placeholder="Alamat restoran"
                style={{
                  width: "100%",
                  height: "48px",
                  borderRadius: "12px",
                  border: "1px solid var(--line)",
                  padding: "0 1rem",
                  fontSize: "0.95rem",
                }}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "0.875rem", fontWeight: "600", marginBottom: "0.5rem" }}>
                Telepon
              </label>
              <input
                name="businessPhone"
                type="text"
                defaultValue={settings?.businessPhone ?? ""}
                placeholder="Nomor telepon"
                style={{
                  width: "100%",
                  height: "48px",
                  borderRadius: "12px",
                  border: "1px solid var(--line)",
                  padding: "0 1rem",
                  fontSize: "0.95rem",
                }}
              />
            </div>
            <button
              type="submit"
              style={{
                height: "48px",
                borderRadius: "999px",
                backgroundColor: "var(--accent)",
                color: "#fff",
                fontWeight: "700",
                border: "none",
              }}
            >
              Simpan Informasi
            </button>
          </form>
        </section>

        {/* Konfigurasi Pajak & Struk */}
        <section className="market-panel">
          <div className="market-panel-heading">
            <h2>Pajak & Struk</h2>
          </div>
          <form
            action="/api/settings/receipt"
            method="POST"
            style={{ display: "grid", gap: "1rem", marginTop: "1rem" }}
          >
            <div>
              <label style={{ display: "block", fontSize: "0.875rem", fontWeight: "600", marginBottom: "0.5rem" }}>
                Pajak (PB1) %
              </label>
              <input
                name="taxPercent"
                type="number"
                min="0"
                max="100"
                defaultValue={settings?.taxPercent ?? 10}
                style={{
                  width: "100%",
                  height: "48px",
                  borderRadius: "12px",
                  border: "1px solid var(--line)",
                  padding: "0 1rem",
                  fontSize: "0.95rem",
                }}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "0.875rem", fontWeight: "600", marginBottom: "0.5rem" }}>
                Service Charge %
              </label>
              <input
                name="serviceChargePercent"
                type="number"
                min="0"
                max="100"
                defaultValue={settings?.serviceChargePercent ?? 0}
                style={{
                  width: "100%",
                  height: "48px",
                  borderRadius: "12px",
                  border: "1px solid var(--line)",
                  padding: "0 1rem",
                  fontSize: "0.95rem",
                }}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "0.875rem", fontWeight: "600", marginBottom: "0.5rem" }}>
                Footer Struk
              </label>
              <textarea
                name="receiptFooter"
                rows={3}
                defaultValue={settings?.receiptFooter ?? ""}
                placeholder="Terima kasih telah berkunjung!"
                style={{
                  width: "100%",
                  borderRadius: "12px",
                  border: "1px solid var(--line)",
                  padding: "0.75rem 1rem",
                  fontSize: "0.95rem",
                  resize: "vertical",
                }}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "0.875rem", fontWeight: "600", marginBottom: "0.5rem" }}>
                Payload QRIS Statis (opsional)
              </label>
              <input
                name="staticQrisPayload"
                type="text"
                defaultValue={settings?.staticQrisPayload ?? ""}
                placeholder="Hex payload QRIS"
                style={{
                  width: "100%",
                  height: "48px",
                  borderRadius: "12px",
                  border: "1px solid var(--line)",
                  padding: "0 1rem",
                  fontSize: "0.95rem",
                }}
              />
            </div>
            <button
              type="submit"
              style={{
                height: "48px",
                borderRadius: "999px",
                backgroundColor: "var(--accent)",
                color: "#fff",
                fontWeight: "700",
                border: "none",
              }}
            >
              Simpan Pengaturan Struk
            </button>
          </form>
        </section>
      </div>

      {/* Daftar Outlet */}
      <section className="market-panel">
        <div className="market-panel-heading">
          <h2>Daftar Outlet</h2>
        </div>
        <div style={{ marginTop: "1rem" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
            <thead>
              <tr style={{ borderBottom: "2px solid var(--line)" }}>
                <th style={{ padding: "0.75rem 1rem", color: "var(--muted)" }}>Nama Outlet</th>
                <th style={{ padding: "0.75rem 1rem", color: "var(--muted)" }}>Alamat</th>
                <th style={{ padding: "0.75rem 1rem", color: "var(--muted)" }}>Telepon</th>
                <th style={{ padding: "0.75rem 1rem", color: "var(--muted)" }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {outlets.map((outlet) => (
                <tr key={outlet.id} style={{ borderBottom: "1px solid var(--line-2)" }}>
                  <td style={{ padding: "1rem", fontWeight: "700" }}>{outlet.name}</td>
                  <td style={{ padding: "1rem" }}>{outlet.address ?? "—"}</td>
                  <td style={{ padding: "1rem" }}>{outlet.phone ?? "—"}</td>
                  <td style={{ padding: "1rem" }}>
                    <span
                      style={{
                        padding: "0.25rem 0.5rem",
                        borderRadius: "8px",
                        backgroundColor: outlet.isActive ? "#e4f5ee" : "#fdeaec",
                        color: outlet.isActive ? "#0e7a57" : "#ef4444",
                        fontSize: "0.75rem",
                        fontWeight: "700",
                      }}
                    >
                      {outlet.isActive ? "Aktif" : "Nonaktif"}
                    </span>
                  </td>
                </tr>
              ))}
              {outlets.length === 0 && (
                <tr>
                  <td colSpan={4} style={{ padding: "2rem", textAlign: "center", color: "var(--muted)" }}>
                    Belum ada outlet terdaftar.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
