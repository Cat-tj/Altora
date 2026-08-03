import { auth } from "../../../../auth";
import { listStockTransfers } from "../../../../lib/market-stock-transfer";

export default async function TransferStokPage() {
  const session = await auth();
  const user = session!.user as { tenantId: string };
  const transfers = await listStockTransfers(user.tenantId);

  return (
    <div className="market-stack">
      <div className="market-page-title">
        <div>
          <p>Produk & Stok</p>
          <h1>Transfer Stok Inter-Outlet</h1>
          <span>Mutasi pengiriman barang dan persediaan stok antar cabang outlet.</span>
        </div>
      </div>

      <section className="market-panel">
        <div className="market-panel-heading">
          <h2>Riwayat Transfer Stok</h2>
        </div>
        <div style={{ marginTop: "1rem" }}>
          {transfers.length === 0 ? (
            <p style={{ color: "var(--muted)", fontStyle: "italic", padding: "1rem 0" }}>
              Belum ada riwayat transfer stok.
            </p>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid var(--line)" }}>
                  <th style={{ padding: "0.75rem 1rem", color: "var(--muted)" }}>Tanggal</th>
                  <th style={{ padding: "0.75rem 1rem", color: "var(--muted)" }}>Produk</th>
                  <th style={{ padding: "0.75rem 1rem", color: "var(--muted)" }}>Dari Outlet</th>
                  <th style={{ padding: "0.75rem 1rem", color: "var(--muted)" }}>Ke Outlet</th>
                  <th style={{ padding: "0.75rem 1rem", color: "var(--muted)" }}>Jumlah (Qty)</th>
                  <th style={{ padding: "0.75rem 1rem", color: "var(--muted)" }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {transfers.map((t) => (
                  <tr key={t.id} style={{ borderBottom: "1px solid var(--line-2)" }}>
                    <td style={{ padding: "1rem", fontSize: "0.85rem", color: "var(--muted)" }}>
                      {new Date(t.createdAt).toLocaleDateString("id-ID")}
                    </td>
                    <td style={{ padding: "1rem", fontWeight: "700" }}>{t.productName}</td>
                    <td style={{ padding: "1rem" }}>{t.fromOutletName}</td>
                    <td style={{ padding: "1rem" }}>{t.toOutletName}</td>
                    <td style={{ padding: "1rem", fontWeight: "700" }} className="num">{t.qty}</td>
                    <td style={{ padding: "1rem" }}>
                      <span
                        style={{
                          padding: "0.25rem 0.5rem",
                          borderRadius: "8px",
                          backgroundColor: t.status === "COMPLETED" ? "#e4f5ee" : "#fef2dc",
                          color: t.status === "COMPLETED" ? "#0e7a57" : "#d97706",
                          fontSize: "0.75rem",
                          fontWeight: "700",
                        }}
                      >
                        {t.status}
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
