"use client";

import { useActionState, useState } from "react";
import {
  cancelReceiptAction,
  completeReceiptAction,
  createReceiptAction,
  type FormState,
} from "./actions";

const initial: FormState = {};

function Notice({ state }: { state: FormState }) {
  if (state.error) return <p className="market-form-error" role="alert">{state.error}</p>;
  if (state.success) return <p className="market-form-success" role="status">{state.success}</p>;
  return null;
}

export function NewReceiptForm({
  outlets,
  suppliers,
  products,
}: {
  outlets: { id: string; name: string }[];
  suppliers: { id: string; name: string }[];
  products: { id: string; name: string; sku: string | null }[];
}) {
  const [state, action, pending] = useActionState(createReceiptAction, initial);
  const [query, setQuery] = useState("");
  const [picked, setPicked] = useState<string[]>([]);

  /* Katalog bisa panjang, jadi barang dipilih dulu baru diisi jumlahnya.
     Ini juga menjaga form tetap pendek saat dibuka di HP di area terima
     barang, bukan di depan komputer. */
  const matches = query.trim()
    ? products
        .filter((product) => !picked.includes(product.id))
        .filter((product) =>
          `${product.name} ${product.sku ?? ""}`.toLowerCase().includes(query.trim().toLowerCase()),
        )
        .slice(0, 6)
    : [];

  const chosen = picked
    .map((productId) => products.find((product) => product.id === productId))
    .filter((product): product is (typeof products)[number] => Boolean(product));

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
          Supplier
          <select name="supplierId" defaultValue="">
            <option value="">Tanpa supplier</option>
            {suppliers.map((supplier) => (
              <option key={supplier.id} value={supplier.id}>{supplier.name}</option>
            ))}
          </select>
        </label>
      </div>

      <label className="receipt-search">
        Cari barang
        <input
          autoComplete="off"
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Ketik nama produk atau barcode"
          type="search"
          value={query}
        />
      </label>

      {matches.length > 0 && (
        <ul className="receipt-suggest">
          {matches.map((product) => (
            <li key={product.id}>
              <button
                onClick={() => {
                  setPicked((current) => [...current, product.id]);
                  setQuery("");
                }}
                type="button"
              >
                <strong>{product.name}</strong>
                <span>{product.sku ?? "tanpa barcode"}</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {chosen.length > 0 ? (
        <div className="market-table-scroll">
          <table>
            <caption className="sr-only">Barang yang diterima</caption>
            <thead>
              <tr>
                <th scope="col">Produk</th>
                <th scope="col">Diterima</th>
                <th scope="col">Rusak</th>
                <th scope="col">Harga beli</th>
                <th scope="col"><span className="sr-only">Aksi</span></th>
              </tr>
            </thead>
            <tbody>
              {chosen.map((product) => (
                <tr key={product.id}>
                  <td><strong>{product.name}</strong></td>
                  <td>
                    <input aria-label={`Jumlah diterima ${product.name}`} defaultValue={1} min={0} name={`qty__${product.id}`} type="number" />
                  </td>
                  <td>
                    <input aria-label={`Jumlah rusak ${product.name}`} defaultValue={0} min={0} name={`defect__${product.id}`} type="number" />
                  </td>
                  <td>
                    <input aria-label={`Harga beli ${product.name}`} defaultValue={0} min={0} name={`cost__${product.id}`} type="number" />
                  </td>
                  <td>
                    <button
                      className="market-link-button"
                      onClick={() => setPicked((current) => current.filter((value) => value !== product.id))}
                      type="button"
                    >
                      Hapus
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="receipt-hint">Cari lalu pilih barang yang datang untuk mulai mencatat.</p>
      )}

      <div className="receipt-row">
        <label>
          Ongkos kirim
          <input defaultValue={0} min={0} name="shippingCost" type="number" />
        </label>
        <label>
          Biaya lain
          <input defaultValue={0} min={0} name="otherCost" type="number" />
        </label>
      </div>

      <label>
        Catatan
        <input name="notes" placeholder="Opsional, mis. nomor surat jalan" type="text" />
      </label>

      <button className="market-checkout-button" disabled={pending || chosen.length === 0} type="submit">
        {pending ? "Menyimpan…" : "Simpan sebagai draft"}
      </button>
    </form>
  );
}

export function CompleteReceiptButton({ receiptId }: { receiptId: string }) {
  const [state, action, pending] = useActionState(completeReceiptAction, initial);
  return (
    <form action={action} className="receipt-inline-form">
      <input name="receiptId" type="hidden" value={receiptId} />
      <button className="market-checkout-button" disabled={pending} type="submit">
        {pending ? "Memproses…" : "Selesaikan & tambah stok"}
      </button>
      <Notice state={state} />
    </form>
  );
}

export function CancelReceiptButton({ receiptId }: { receiptId: string }) {
  const [state, action, pending] = useActionState(cancelReceiptAction, initial);
  return (
    <form action={action} className="receipt-inline-form">
      <input name="receiptId" type="hidden" value={receiptId} />
      <button className="market-link-button" disabled={pending} type="submit">
        {pending ? "Membatalkan…" : "Batalkan draft"}
      </button>
      <Notice state={state} />
    </form>
  );
}
