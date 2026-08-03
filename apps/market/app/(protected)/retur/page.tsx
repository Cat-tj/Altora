import { auth } from "../../../auth";
import { listReturns } from "../../../lib/market-returns";
import type { MarketRole } from "../../../lib/market-user";
import { EmptyMarketState, formatRupiah } from "../market-page-ui";
import { ReturnWorkflow } from "./return-forms";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

export default async function ReturnsPage() {
  const session = await auth();
  const sessionUser = session!.user as { id: string; tenantId: string; role: MarketRole };
  const user = { tenantId: sessionUser.tenantId, userId: sessionUser.id, role: sessionUser.role };

  const returns = await listReturns(user);

  return (
    <div className="market-stack">
      <div className="market-page-title">
        <div>
          <p>Penjualan</p>
          <h1>Retur barang</h1>
          <span>Kembalikan sebagian barang dari nota yang sudah dibayar.</span>
        </div>
      </div>

      <section className="market-panel">
        <div className="market-panel-heading">
          <div>
            <h2>Catat retur</h2>
            <p>Mulai dari nomor nota yang dibawa pelanggan.</p>
          </div>
        </div>
        <ReturnWorkflow />
      </section>

      <section className="market-panel">
        <div className="market-panel-heading">
          <div>
            <h2>Riwayat retur</h2>
            <p>{returns.length} retur tercatat.</p>
          </div>
        </div>

        {returns.length ? (
          <div className="market-table-scroll">
            <table>
              <caption className="sr-only">Riwayat retur penjualan</caption>
              <thead>
                <tr>
                  <th scope="col">Retur</th>
                  <th scope="col">Nota asal</th>
                  <th scope="col">Outlet</th>
                  <th scope="col">Qty</th>
                  <th scope="col">Kembali ke stok</th>
                  <th scope="col">Refund</th>
                  <th scope="col">Alasan</th>
                </tr>
              </thead>
              <tbody>
                {returns.map((entry) => (
                  <tr key={entry.id}>
                    <td>
                      <strong>{entry.returnNumber}</strong>
                      <span className="receipt-meta">{formatDate(entry.createdAt)} · {entry.createdByName}</span>
                    </td>
                    <td>{entry.invoiceNumber}</td>
                    <td>{entry.outletName}</td>
                    <td className="num">{entry.totalQty}</td>
                    <td className="num">{entry.restockCount}</td>
                    <td>{formatRupiah(entry.refundAmount)}</td>
                    <td>{entry.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyMarketState
            description="Retur yang tercatat akan muncul di sini beserta nota asalnya."
            title="Belum ada retur"
          />
        )}
      </section>
    </div>
  );
}
