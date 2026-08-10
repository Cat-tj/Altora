import { requireRole } from "../../../lib/market-authz";
import { listAuditLogs } from "../../../lib/market-audit-logs";

export default async function AuditLogPage() {
  const user = await requireRole(["OWNER"]);
  const logs = await listAuditLogs(user.tenantId);

  return (
    <div className="market-stack">
      <div className="market-page-title">
        <div>
          <p>SDM & Pengaturan</p>
          <h1>Log Audit Keamanan</h1>
          <span>Rekam jejak tindakan sensitif staf (pembatalan transaksi, ubah harga, reset sandi).</span>
        </div>
      </div>

      <section className="market-panel">
        <div className="market-panel-heading">
          <h2>Daftar Aktivitas Terrekam</h2>
        </div>
        <div style={{ marginTop: "1rem" }}>
          {logs.length === 0 ? (
            <p style={{ color: "var(--muted)", fontStyle: "italic", padding: "1rem 0" }}>
              Belum ada log audit tercatat.
            </p>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid var(--line)" }}>
                  <th style={{ padding: "0.75rem 1rem", color: "var(--muted)" }}>Waktu</th>
                  <th style={{ padding: "0.75rem 1rem", color: "var(--muted)" }}>Aktor / Pengguna</th>
                  <th style={{ padding: "0.75rem 1rem", color: "var(--muted)" }}>Aksi</th>
                  <th style={{ padding: "0.75rem 1rem", color: "var(--muted)" }}>Deskripsi Detail</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((l) => (
                  <tr key={l.id} style={{ borderBottom: "1px solid var(--line-2)" }}>
                    <td style={{ padding: "1rem", fontSize: "0.85rem", color: "var(--muted)" }} className="num">
                      {new Date(l.createdAt).toLocaleString("id-ID")}
                    </td>
                    <td style={{ padding: "1rem", fontWeight: "700" }}>{l.userName}</td>
                    <td style={{ padding: "1rem" }}>
                      <span
                        style={{
                          padding: "0.25rem 0.5rem",
                          borderRadius: "8px",
                          backgroundColor: "#eee9fd",
                          color: "#7c5ce8",
                          fontSize: "0.75rem",
                          fontWeight: "700",
                        }}
                      >
                        {l.action}
                      </span>
                    </td>
                    <td style={{ padding: "1rem" }}>{l.description}</td>
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
