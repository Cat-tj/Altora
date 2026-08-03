import { auth } from "../../../auth";
import { listAttendances } from "../../../lib/market-attendance";

export default async function AbsensiPage() {
  const session = await auth();
  const user = session!.user as { tenantId: string };
  const records = await listAttendances(user.tenantId);

  return (
    <div className="market-stack">
      <div className="market-page-title">
        <div>
          <p>SDM & Kehadiran</p>
          <h1>Absensi & Jam Kerja Staf</h1>
          <span>Pantau jam kedatangan (Clock In) dan kepulangan (Clock Out) tim outlet Anda.</span>
        </div>
      </div>

      <section className="market-panel">
        <div className="market-panel-heading">
          <h2>Riwayat Kehadiran</h2>
        </div>
        <div style={{ marginTop: "1rem" }}>
          {records.length === 0 ? (
            <p style={{ color: "var(--muted)", fontStyle: "italic", padding: "1rem 0" }}>
              Belum ada riwayat absensi.
            </p>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid var(--line)" }}>
                  <th style={{ padding: "0.75rem 1rem", color: "var(--muted)" }}>Nama Staf</th>
                  <th style={{ padding: "0.75rem 1rem", color: "var(--muted)" }}>Outlet</th>
                  <th style={{ padding: "0.75rem 1rem", color: "var(--muted)" }}>Clock In</th>
                  <th style={{ padding: "0.75rem 1rem", color: "var(--muted)" }}>Clock Out</th>
                  <th style={{ padding: "0.75rem 1rem", color: "var(--muted)" }}>Catatan</th>
                </tr>
              </thead>
              <tbody>
                {records.map((r) => (
                  <tr key={r.id} style={{ borderBottom: "1px solid var(--line-2)" }}>
                    <td style={{ padding: "1rem", fontWeight: "700" }}>{r.userName}</td>
                    <td style={{ padding: "1rem" }}>{r.outletName}</td>
                    <td style={{ padding: "1rem", fontSize: "0.85rem", color: "var(--green)" }} className="num">
                      {new Date(r.clockIn).toLocaleString("id-ID")}
                    </td>
                    <td style={{ padding: "1rem", fontSize: "0.85rem", color: "var(--muted)" }} className="num">
                      {r.clockOut ? new Date(r.clockOut).toLocaleString("id-ID") : "Belum Clock-Out"}
                    </td>
                    <td style={{ padding: "1rem" }}>{r.notes || "-"}</td>
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
