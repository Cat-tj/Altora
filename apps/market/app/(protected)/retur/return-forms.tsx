"use client";

import { useActionState } from "react";
import {
  createReturnAction,
  lookupSaleAction,
  type LookupState,
  type ReturnState,
} from "./actions";

function formatRupiah(amount: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(amount);
}

/**
 * Retur dimulai dari nomor nota, bukan dari daftar transaksi.
 *
 * Pelanggan datang membawa struk, jadi nomor itu yang ada di tangan kasir.
 * Mencari lewat daftar berarti menebak tanggal dan menggulir.
 */
export function ReturnWorkflow() {
  const [lookup, lookupAction, looking] = useActionState<LookupState, FormData>(lookupSaleAction, {});
  const [result, submitAction, submitting] = useActionState<ReturnState, FormData>(createReturnAction, {});

  const sale = lookup.sale;

  return (
    <div className="return-flow">
      <form action={lookupAction} className="return-lookup">
        <label>
          Nomor nota
          <input
            autoComplete="off"
            defaultValue={sale?.invoiceNumber ?? ""}
            name="invoiceNumber"
            placeholder="mis. INV-20260803-0007"
            required
            type="text"
          />
        </label>
        <button className="market-checkout-button" disabled={looking} type="submit" style={{ padding: "0 .7rem", minWidth: 36, height: 36 }}>
          {looking ? "…" : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>}
        </button>
      </form>

      {lookup.error && <p className="market-form-error" role="alert">{lookup.error}</p>}
      {result.error && <p className="market-form-error" role="alert">{result.error}</p>}
      {result.success && <p className="market-form-success" role="status">{result.success}</p>}

      {sale && !result.success && (
        <form action={submitAction} className="return-detail">
          <input name="saleId" type="hidden" value={sale.id} />

          <div className="return-meta">
            <div>
              <span>Nota</span>
              <strong>{sale.invoiceNumber}</strong>
            </div>
            <div>
              <span>Outlet</span>
              <strong>{sale.outletName}</strong>
            </div>
            <div>
              <span>Total</span>
              <strong>{formatRupiah(sale.total)}</strong>
            </div>
          </div>

          <div className="market-table-scroll">
            <table>
              <caption className="sr-only">Barang pada nota {sale.invoiceNumber}</caption>
              <thead>
                <tr>
                  <th scope="col">Produk</th>
                  <th scope="col">Terjual</th>
                  <th scope="col">Sudah diretur</th>
                  <th scope="col">Retur sekarang</th>
                  <th scope="col">Layak jual</th>
                </tr>
              </thead>
              <tbody>
                {sale.items.map((item) => (
                  <tr key={item.saleItemId}>
                    <td><strong>{item.productName}</strong></td>
                    <td className="num">{item.qtySold}</td>
                    <td className="num">{item.qtyReturned || "—"}</td>
                    <td>
                      <input
                        aria-label={`Jumlah retur ${item.productName}`}
                        defaultValue={0}
                        disabled={item.qtyReturnable === 0}
                        max={item.qtyReturnable}
                        min={0}
                        name={`qty__${item.saleItemId}`}
                        type="number"
                      />
                    </td>
                    <td>
                      <input
                        aria-label={`${item.productName} layak dijual kembali`}
                        defaultChecked
                        disabled={item.qtyReturnable === 0}
                        name={`restock__${item.saleItemId}`}
                        type="checkbox"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="receipt-hint">
            Hilangkan centang &ldquo;layak jual&rdquo; bila barang kembali dalam keadaan rusak — jumlahnya tetap
            tercatat tapi tidak ditambahkan ke stok.
          </p>

          <label>
            Alasan retur
            <input name="reason" placeholder="mis. kemasan penyok, salah ukuran" required type="text" />
          </label>

          <button className="market-checkout-button" disabled={submitting} type="submit">
            {submitting ? "Menyimpan…" : "Catat retur"}
          </button>
        </form>
      )}
    </div>
  );
}
