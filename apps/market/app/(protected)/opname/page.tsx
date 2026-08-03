import { auth } from "../../../auth";
import { db } from "../../../lib/db";
import { getCountSheet, listStockCounts } from "../../../lib/market-stock-count";
import type { MarketRole } from "../../../lib/market-user";
import { EmptyMarketState } from "../market-page-ui";
import { ApplyCountButton, CancelCountButton, CountSheetForm } from "./count-forms";

const statusLabels: Record<string, string> = {
  DRAFT: "Draft",
  APPLIED: "Diterapkan",
  CANCELLED: "Dibatalkan",
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

export default async function StockCountPage() {
  const session = await auth();
  const sessionUser = session!.user as { id: string; tenantId: string; role: MarketRole };
  const user = { tenantId: sessionUser.tenantId, userId: sessionUser.id, role: sessionUser.role };
  const canManage = user.role !== "STAFF";

  const outlets = await db.query(
    `SELECT o.id, o.name FROM "Outlet" o
      WHERE o."tenantId" = $1
        AND ($3::text = 'OWNER' OR EXISTS (SELECT 1 FROM "UserOutlet" uo
              WHERE uo."outletId" = o.id AND uo."userId" = $2 AND uo."tenantId" = $1))
        AND o."isActive" = true
      ORDER BY o.name`,
    [user.tenantId, user.userId, user.role],
  );

  const firstOutlet = outlets.rows[0]?.id as string | undefined;
  const [counts, sheet] = await Promise.all([
    listStockCounts(user),
    firstOutlet ? getCountSheet(user.tenantId, firstOutlet) : Promise.resolve([]),
  ]);

  return (
    <div className="market-stack">
      <div className="market-page-title">
        <div>
          <p>Produk &amp; stok</p>
          <h1>Stock opname</h1>
          <span>Cocokkan hitungan fisik dengan catatan sistem, lalu terapkan selisihnya.</span>
        </div>
      </div>

      {canManage && (
        <section className="market-panel">
          <div className="market-panel-heading">
            <div>
              <h2>Lembar hitung</h2>
              <p>Isi hanya produk yang benar-benar dihitung. Selisih baru masuk stok setelah diterapkan.</p>
            </div>
          </div>
          <CountSheetForm outlets={outlets.rows as { id: string; name: string }[]} products={sheet} />
        </section>
      )}

      <section className="market-panel">
        <div className="market-panel-heading">
          <div>
            <h2>Riwayat opname</h2>
            <p>{counts.length} opname tercatat.</p>
          </div>
        </div>

        {counts.length ? (
          <div className="market-table-scroll">
            <table>
              <caption className="sr-only">Riwayat stock opname</caption>
              <thead>
                <tr>
                  <th scope="col">Opname</th>
                  <th scope="col">Outlet</th>
                  <th scope="col">Produk</th>
                  <th scope="col">Lebih</th>
                  <th scope="col">Kurang</th>
                  <th scope="col">Status</th>
                  {canManage && <th scope="col"><span className="sr-only">Aksi</span></th>}
                </tr>
              </thead>
              <tbody>
                {counts.map((count) => (
                  <tr key={count.id}>
                    <td>
                      <strong>{count.countNumber}</strong>
                      <span className="receipt-meta">{formatDate(count.createdAt)} · {count.createdByName}</span>
                    </td>
                    <td>{count.outletName}</td>
                    <td className="num">{count.itemCount}</td>
                    <td className="num">{count.surplus ? `+${count.surplus}` : "—"}</td>
                    <td className="num">{count.shortage ? `−${count.shortage}` : "—"}</td>
                    <td>
                      <span className={`receipt-status is-${count.status.toLowerCase()}`}>
                        {statusLabels[count.status]}
                      </span>
                    </td>
                    {canManage && (
                      <td>
                        {count.status === "DRAFT" && (
                          <div className="receipt-actions">
                            <ApplyCountButton countId={count.id} />
                            <CancelCountButton countId={count.id} />
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
            description="Opname yang tercatat akan muncul di sini beserta selisihnya."
            title="Belum ada stock opname"
          />
        )}
      </section>
    </div>
  );
}
