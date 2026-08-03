"use client";

import { useActionState, useState } from "react";
import { applyCountAction, cancelCountAction, createCountAction, type CountState } from "./actions";

const initial: CountState = {};

function Notice({ state }: { state: CountState }) {
  if (state.error) return <p className="market-form-error" role="alert">{state.error}</p>;
  if (state.success) return <p className="market-form-success" role="status">{state.success}</p>;
  return null;
}

export function CountSheetForm({
  outlets,
  products,
}: {
  outlets: { id: string; name: string }[];
  products: { id: string; name: string; sku: string | null; systemQty: number }[];
}) {
  const [state, action, pending] = useActionState(createCountAction, initial);
  const [counted, setCounted] = useState<Record<string, string>>({});

  /* Saldo sistem sengaja tidak diperlihatkan sebelum diisi. Kalau angkanya
     terlihat, orang cenderung mengetik ulang angka itu daripada menghitung —
     dan opname jadi tidak ada gunanya. Selisih baru muncul setelah diisi. */
  const filled = Object.entries(counted).filter(([, value]) => value.trim() !== "");

  return (
    <form action={action} className="receipt-form">
      <Notice state={state} />

      <div className="receipt-row">
        <label>
          Outlet
          <select name="outletId" required>
            {outlets.map((outlet) => (
              <option key={outlet.id} value={outlet.id}>{outlet.name}</option>
            ))}
          </select>
        </label>
        <label>
          Catatan
          <input name="notes" placeholder="Opsional, mis. opname rak sembako" type="text" />
        </label>
      </div>

      <div className="market-table-scroll">
        <table>
          <caption className="sr-only">Lembar hitung stok</caption>
          <thead>
            <tr>
              <th scope="col">Produk</th>
              <th scope="col">Hitungan fisik</th>
              <th scope="col">Selisih</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => {
              const value = counted[product.id] ?? "";
              const delta = value.trim() === "" ? null : Number(value) - product.systemQty;
              return (
                <tr key={product.id}>
                  <td>
                    <strong>{product.name}</strong>
                    <span className="receipt-meta">{product.sku ?? "tanpa barcode"}</span>
                  </td>
                  <td>
                    <input
                      aria-label={`Hitungan fisik ${product.name}`}
                      min={0}
                      name={`count__${product.id}`}
                      onChange={(event) =>
                        setCounted((current) => ({ ...current, [product.id]: event.target.value }))
                      }
                      placeholder="—"
                      type="number"
                      value={value}
                    />
                  </td>
                  <td>
                    {delta === null ? (
                      <span className="count-skip">belum dihitung</span>
                    ) : delta === 0 ? (
                      <span className="count-match">cocok</span>
                    ) : (
                      <span className={delta > 0 ? "count-surplus" : "count-shortage"}>
                        {delta > 0 ? `+${delta}` : delta} (sistem {product.systemQty})
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <button className="market-checkout-button" disabled={pending || filled.length === 0} type="submit">
        {pending ? "Menyimpan…" : `Simpan draft (${filled.length} produk dihitung)`}
      </button>
    </form>
  );
}

export function ApplyCountButton({ countId }: { countId: string }) {
  const [state, action, pending] = useActionState(applyCountAction, initial);
  return (
    <form action={action} className="receipt-inline-form">
      <input name="countId" type="hidden" value={countId} />
      <button className="market-checkout-button" disabled={pending} type="submit">
        {pending ? "Menerapkan…" : "Terapkan ke stok"}
      </button>
      <Notice state={state} />
    </form>
  );
}

export function CancelCountButton({ countId }: { countId: string }) {
  const [state, action, pending] = useActionState(cancelCountAction, initial);
  return (
    <form action={action} className="receipt-inline-form">
      <input name="countId" type="hidden" value={countId} />
      <button className="market-link-button" disabled={pending} type="submit">
        {pending ? "Membatalkan…" : "Batalkan draft"}
      </button>
      <Notice state={state} />
    </form>
  );
}
