import { auth } from "../../../auth";
import { db } from "../../../lib/db";
import { listMarketProducts } from "../../../lib/market-products";
import { listReceipts, listSuppliers } from "../../../lib/market-receiving";
import type { MarketRole } from "../../../lib/market-user";
import { EmptyMarketState, formatRupiah } from "../market-page-ui";
import { CancelReceiptButton, CompleteReceiptButton, NewReceiptForm } from "./receipt-forms";

const statusLabels: Record<string, string> = {
  DRAFT: "Draft",
  COMPLETED: "Selesai",
  CANCELLED: "Dibatalkan",
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

export default async function ReceivingPage() {
  const session = await auth();
  const session_user = session!.user as { id: string; tenantId: string; role: MarketRole };
  const user = { tenantId: session_user.tenantId, userId: session_user.id, role: session_user.role };

  const [receipts, suppliers, products, outlets] = await Promise.all([
    listReceipts(user),
    listSuppliers(user.tenantId),
    listMarketProducts(user.tenantId, user.userId, user.role),
    db.query(
      `SELECT o.id, o.name FROM "Outlet" o
        WHERE o."tenantId" = $1
          AND ($3::text = 'OWNER' OR EXISTS (SELECT 1 FROM "UserOutlet" uo
                WHERE uo."outletId" = o.id AND uo."userId" = $2 AND uo."tenantId" = $1))
          AND o."isActive" = true
        ORDER BY o.name`,
      [user.tenantId, user.userId, user.role],
    ),
  ]);

  const canManage = user.role !== "STAFF";
  const drafts = receipts.filter((receipt) => receipt.status === "DRAFT");

  return (
    <div className="market-stack">
      <div className="market-page-title">
        <div>
          <p>Produk &amp; stok</p>
          <h1>Penerimaan barang</h1>
          <span>Catat barang yang datang, periksa, lalu selesaikan untuk menambah stok.</span>
        </div>
      </div>

      {canManage && (
        <section className="market-panel">
          <div className="market-panel-heading">
            <div>
              <h2>Catat penerimaan</h2>
              <p>Stok baru bertambah setelah nota diselesaikan, bukan saat disimpan.</p>
            </div>
          </div>
          <NewReceiptForm
            outlets={outlets.rows as { id: string; name: string }[]}
            products={products.map((product) => ({ id: product.id, name: product.name, sku: product.sku }))}
            suppliers={suppliers}
          />
        </section>
      )}

      <section className="market-panel">
        <div className="market-panel-heading">
          <div>
            <h2>Riwayat penerimaan</h2>
            <p>
              {receipts.length} nota
              {drafts.length > 0 ? ` · ${drafts.length} menunggu diselesaikan` : ""}
            </p>
          </div>
        </div>

        {receipts.length ? (
          <div className="market-table-scroll">
            <table>
              <caption className="sr-only">Riwayat nota penerimaan barang</caption>
              <thead>
                <tr>
                  <th scope="col">Nota</th>
                  <th scope="col">Outlet</th>
                  <th scope="col">Supplier</th>
                  <th scope="col">Diterima</th>
                  <th scope="col">Rusak</th>
                  <th scope="col">Nilai</th>
                  <th scope="col">Status</th>
                  {canManage && <th scope="col"><span className="sr-only">Aksi</span></th>}
                </tr>
              </thead>
              <tbody>
                {receipts.map((receipt) => (
                  <tr key={receipt.id}>
                    <td>
                      <strong>{receipt.receiptNumber}</strong>
                      <span className="receipt-meta">{formatDate(receipt.receivedAt)}</span>
                    </td>
                    <td>{receipt.outletName}</td>
                    <td>{receipt.supplierName ?? "—"}</td>
                    <td className="num">{receipt.totalAccepted}</td>
                    <td className="num">{receipt.totalDefect || "—"}</td>
                    <td>{formatRupiah(receipt.totalCost)}</td>
                    <td>
                      <span className={`receipt-status is-${receipt.status.toLowerCase()}`}>
                        {statusLabels[receipt.status]}
                      </span>
                    </td>
                    {canManage && (
                      <td>
                        {receipt.status === "DRAFT" && (
                          <div className="receipt-actions">
                            <CompleteReceiptButton receiptId={receipt.id} />
                            <CancelReceiptButton receiptId={receipt.id} />
                          </div>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyMarketState
            description="Nota penerimaan akan muncul di sini setelah barang pertama dicatat."
            title="Belum ada penerimaan barang"
          />
        )}
      </section>
    </div>
  );
}
