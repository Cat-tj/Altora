import { requireRole } from "../../../lib/market-authz";
import { db } from "../../../lib/db";
import { listMarketExpenses } from "../../../lib/market-expenses";
import { formatRupiah } from "../market-page-ui";

export default async function PengeluaranPage() {
  const user = await requireRole(["OWNER", "MANAGER"]);
  const expenses = await listMarketExpenses(user.tenantId);

  const outletsResult = await db.query<{ id: string; name: string }>(
    `SELECT id, name FROM "Outlet" WHERE "tenantId" = $1 ORDER BY name ASC`,
    [user.tenantId]
  );
  const outlets = outletsResult.rows;

  const categoryLabels: Record<string, string> = {
    RENT: "Sewa Tempat",
    UTILITIES: "Listrik, Air, & Internet",
    SALARY: "Gaji & Bonus Staf",
    SUPPLIES: "Bahan & Perlengkapan",
    MARKETING: "Iklan & Pemasaran",
    TRANSPORT: "Transportasi & Logistik",
    EVENT: "Acara & Booth",
    OTHER: "Lain-lain",
  };

  return (
    <div className="market-stack">
      <div className="market-page-title">
        <div>
          <p>Laporan & Keuangan</p>
          <h1>Pengeluaran Operasional</h1>
          <span>Catat biaya rutin dan pengeluaran tak terduga toko Anda.</span>
        </div>
      </div>

      <div className="market-content-grid" style={{ gridTemplateColumns: "2fr 1fr" }}>
        {/* Riwayat Pengeluaran */}
        <section className="market-panel">
          <div className="market-panel-heading">
            <h2>Riwayat Pengeluaran</h2>
          </div>
          <div style={{ marginTop: "1rem" }}>
            {expenses.length === 0 ? (
              <p style={{ color: "var(--muted)", fontStyle: "italic", padding: "1rem 0" }}>
                Belum ada catatan pengeluaran.
              </p>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid var(--line)" }}>
                    <th style={{ padding: "0.75rem 1rem", color: "var(--muted)" }}>Tanggal</th>
                    <th style={{ padding: "0.75rem 1rem", color: "var(--muted)" }}>Kategori</th>
                    <th style={{ padding: "0.75rem 1rem", color: "var(--muted)" }}>Keterangan</th>
                    <th style={{ padding: "0.75rem 1rem", color: "var(--muted)" }}>Nominal</th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.map((exp) => (
                    <tr key={exp.id} style={{ borderBottom: "1px solid var(--line-2)" }}>
                      <td style={{ padding: "1rem", fontSize: "0.85rem", color: "var(--muted)" }}>
                        {new Date(exp.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                      </td>
                      <td style={{ padding: "1rem", fontWeight: "700" }}>
                        {categoryLabels[exp.category] || exp.category}
                      </td>
                      <td style={{ padding: "1rem" }}>{exp.description || "-"}</td>
                      <td style={{ padding: "1rem", color: "var(--red)", fontWeight: "700" }} className="num">
                        -{formatRupiah(exp.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>

        {/* Form Tambah Pengeluaran */}
        <section className="market-panel" style={{ height: "fit-content" }}>
          <div className="market-panel-heading">
            <h2>Tambah Pengeluaran</h2>
          </div>
          <form action="/api/expenses" method="POST" style={{ display: "grid", gap: "1rem", marginTop: "1rem" }}>
            <div>
              <label htmlFor="outletId" style={{ display: "block", fontSize: "0.875rem", fontWeight: "600", marginBottom: "0.5rem" }}>
                Outlet
              </label>
              <select
                id="outletId"
                name="outletId"
                style={{
                  width: "100%",
                  height: "52px",
                  borderRadius: "999px",
                  border: "1px solid var(--line)",
                  padding: "0 1.25rem",
                  fontSize: "1rem",
                  backgroundColor: "var(--surface)",
                }}
                required
              >
                {outlets.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="category" style={{ display: "block", fontSize: "0.875rem", fontWeight: "600", marginBottom: "0.5rem" }}>
                Kategori
              </label>
              <select
                id="category"
                name="category"
                style={{
                  width: "100%",
                  height: "52px",
                  borderRadius: "999px",
                  border: "1px solid var(--line)",
                  padding: "0 1.25rem",
                  fontSize: "1rem",
                  backgroundColor: "var(--surface)",
                }}
              >
                <option value="RENT">Sewa Tempat</option>
                <option value="UTILITIES">Listrik, Air, & Internet</option>
                <option value="SALARY">Gaji & Bonus Staf</option>
                <option value="SUPPLIES">Bahan & Perlengkapan</option>
                <option value="MARKETING">Iklan & Pemasaran</option>
                <option value="TRANSPORT">Transportasi & Logistik</option>
                <option value="OTHER">Lain-lain</option>
              </select>
            </div>

            <div>
              <label htmlFor="amount" style={{ display: "block", fontSize: "0.875rem", fontWeight: "600", marginBottom: "0.5rem" }}>
                Nominal (Rp)
              </label>
              <input
                id="amount"
                name="amount"
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
                required
              />
            </div>

            <div>
              <label htmlFor="description" style={{ display: "block", fontSize: "0.875rem", fontWeight: "600", marginBottom: "0.5rem" }}>
                Keterangan
              </label>
              <input
                id="description"
                name="description"
                type="text"
                placeholder="Catatan opsional"
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
              Simpan Pengeluaran
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
