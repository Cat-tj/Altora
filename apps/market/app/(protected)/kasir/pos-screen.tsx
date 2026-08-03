"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { createMarketSaleAction } from "./actions";
import { VariantPickerModal, type VariantGroup } from "./variant-picker-modal";
import { MemberPicker, type MemberOption } from "./member-picker";
import { PaymentSheet, type PaymentMethod } from "./payment-sheet";

type Product = { id: string; name: string; sku: string | null; price: number; stock: number; trackStock: boolean; variantGroups: VariantGroup[] };
type CartLine = { productId: string; quantity: number; variantOptionIds: string[]; variantLabel: string | null; unitPrice: number };
type Cart = Map<string, CartLine>;
const money = (value: number) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(value);

export function MarketPosScreen({ products, shift, members }: { products: Product[]; shift: { id: string; outletName: string }; members: MemberOption[] }) {
  const [cart, setCart] = useState<Cart>(new Map());
  const [query, setQuery] = useState("");
  const [state, setState] = useState<{ error?: string; success?: string }>({});
  const [pending, setPending] = useState(false);
  const [requestId, setRequestId] = useState(() => crypto.randomUUID());
  const [variantProduct, setVariantProduct] = useState<Product | null>(null);
  const [showMemberPicker, setShowMemberPicker] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [member, setMember] = useState<MemberOption | null>(null);
  const errorRef = useRef<HTMLParagraphElement>(null);

  const cartLines = [...cart.values()];
  const total = cartLines.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0);
  const visible = useMemo(() => products.filter((product) => `${product.name} ${product.sku ?? ""}`.toLowerCase().includes(query.toLowerCase())), [products, query]);

  function cartKey(productId: string, optionIds: string[]) {
    return optionIds.length ? `${productId}:${optionIds.join("+")}` : productId;
  }

  function addToCart(product: Product, optionIds: string[], variantLabel: string | null) {
    const priceDelta = optionIds.reduce((sum, id) => {
      const option = product.variantGroups.flatMap((g) => g.options).find((o) => o.id === id);
      return sum + (option?.priceDelta ?? 0);
    }, 0);
    const unitPrice = product.price + priceDelta;
    setCart((old) => {
      const next = new Map(old);
      const key = cartKey(product.id, optionIds);
      const existing = next.get(key);
      const quantity = Math.min((existing?.quantity ?? 0) + 1, product.trackStock ? product.stock : Number.MAX_SAFE_INTEGER);
      next.set(key, { productId: product.id, quantity, variantOptionIds: optionIds, variantLabel, unitPrice });
      return next;
    });
  }

  function updateQuantity(key: string, amount: number) {
    setCart((old) => {
      const next = new Map(old);
      const line = next.get(key);
      if (!line) return next;
      const product = products.find((p) => p.id === line.productId)!;
      const quantity = Math.max(0, Math.min(line.quantity + amount, product.trackStock ? product.stock : Number.MAX_SAFE_INTEGER));
      if (quantity) next.set(key, { ...line, quantity });
      else next.delete(key);
      return next;
    });
  }

  function onProductClick(product: Product) {
    if (product.variantGroups.length > 0) setVariantProduct(product);
    else addToCart(product, [], null);
  }

  async function checkout(payments: { method: PaymentMethod; amount: number }[], memberId?: string) {
    setState({});
    setPending(true);
    const single = payments.length === 1;
    const result = await createMarketSaleAction({
      shiftId: shift.id,
      requestId,
      items: cartLines.map((line) => ({ productId: line.productId, quantity: line.quantity, variantOptionIds: line.variantOptionIds.length ? line.variantOptionIds : undefined })),
      paymentMethod: single ? payments[0]!.method : undefined,
      amountPaid: single ? payments[0]!.amount : undefined,
      payments: single ? undefined : payments,
      memberId,
    });
    setPending(false);
    if (result.error) {
      setState({ error: result.error });
      requestAnimationFrame(() => errorRef.current?.focus());
      return;
    }
    setCart(new Map());
    setMember(null);
    setRequestId(crypto.randomUUID());
    setState({ success: `Transaksi ${result.sale!.invoiceNumber} tersimpan. Total ${money(result.sale!.total)}${result.sale!.change ? `; kembalian ${money(result.sale!.change)}.` : "."}` });
  }

  return (
    <section className="market-cashier" aria-labelledby="cashier-title">
      <div className="market-page-title is-cashier">
        <div>
          <p>Kasir · {shift.outletName}</p>
          <h1 id="cashier-title">Penjualan baru</h1>
          <span>Pilih produk, periksa jumlah, lalu selesaikan pembayaran.</span>
        </div>
        <div className="market-primary-actions">
          <Link href="/kasir/riwayat">Riwayat</Link>
          <Link href={`/kasir/tutup/${shift.id}`}>Tutup shift</Link>
        </div>
      </div>
      <p className="sr-only" role="status" aria-atomic="true">
        {cartLines.length ? `${cartLines.reduce((sum, line) => sum + line.quantity, 0)} item di keranjang. Total ${money(total)}.` : "Keranjang kosong."}
      </p>
      <div className="market-pos-layout">
        <section className="market-pos-catalog" aria-labelledby="catalog-title">
          <div className="market-search-wrap">
            <label htmlFor="product-search">Cari nama, SKU, atau barcode</label>
            <input id="product-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Misalnya: air mineral" autoComplete="off" />
          </div>
          <h2 id="catalog-title">Produk tersedia</h2>
          <div className="market-product-grid">
            {visible.map((product) => (
              <article key={product.id}>
                <button type="button" onClick={() => onProductClick(product)} style={{ width: "100%", textAlign: "left", background: "none", border: 0, cursor: "pointer", padding: 0 }}>
                  <span className="market-product-mark" aria-hidden="true">{product.name.slice(0, 1)}</span>
                  <strong>{product.name}</strong>
                  <small>{money(product.price)}</small>
                  {product.variantGroups.length > 0 && <em style={{ display: "block", fontSize: ".75rem", color: "var(--market-accent, #0f6b5c)", fontStyle: "normal", fontWeight: 800 }}>Pilih varian</em>}
                  {product.trackStock && <small>{product.stock} tersisa</small>}
                </button>
              </article>
            ))}
          </div>
        </section>

        <section className="market-cart" aria-labelledby="cart-title">
          <div className="market-cart-heading">
            <h2 id="cart-title">Keranjang</h2>
            {member && (
              <button type="button" onClick={() => setShowMemberPicker(true)} style={{ border: "1px solid #aebfbc", borderRadius: ".55rem", padding: ".3rem .6rem", background: "#e8f4f1", cursor: "pointer", fontWeight: 700 }}>
                {member.name} · Deposit {money(member.depositBalance)}
              </button>
            )}
            {!member && (
              <button type="button" onClick={() => setShowMemberPicker(true)} style={{ border: "1px solid #aebfbc", borderRadius: ".55rem", padding: ".3rem .6rem", background: "#fff", cursor: "pointer", fontWeight: 700 }}>
                + Member
              </button>
            )}
          </div>
          {cartLines.length === 0 && <p className="market-empty-cart">Keranjang kosong. Pilih produk dari katalog.</p>}
          {cartLines.map((line) => {
            const product = products.find((p) => p.id === line.productId);
            return (
              <div key={cartKey(line.productId, line.variantOptionIds)} className="market-quantity">
                <div style={{ flex: 1 }}>
                  <strong style={{ display: "block" }}>{product?.name ?? line.productId}</strong>
                  {line.variantLabel && <small style={{ color: "var(--market-muted)" }}>{line.variantLabel} · {money(line.unitPrice)}</small>}
                  <small style={{ color: "var(--market-muted)" }}>{money(line.unitPrice * line.quantity)}</small>
                </div>
                <div style={{ display: "flex", gap: ".4rem", alignItems: "center" }}>
                  <button type="button" onClick={() => updateQuantity(cartKey(line.productId, line.variantOptionIds), -1)} aria-label={`Kurangi ${product?.name ?? ""}`}>−</button>
                  <span aria-live="polite">{line.quantity}</span>
                  <button type="button" onClick={() => updateQuantity(cartKey(line.productId, line.variantOptionIds), 1)} aria-label={`Tambah ${product?.name ?? ""}`}>+</button>
                </div>
              </div>
            );
          })}
          <dl className="market-cart-total">
            <div><dt>Total</dt><dd>{money(total)}</dd></div>
          </dl>
          <button type="button" className="market-checkout-button" disabled={cartLines.length === 0 || pending} onClick={() => setShowPayment(true)}>
            {pending ? "Menyimpan…" : `Bayar ${money(total)}`}
          </button>
          {state.success && <p className="market-form-success" role="status">{state.success}</p>}
          {state.error && <p className="market-form-error" ref={errorRef} role="alert" tabIndex={-1}>{state.error}</p>}
        </section>
      </div>

      {variantProduct && (
        <VariantPickerModal
          productName={variantProduct.name}
          basePrice={variantProduct.price}
          groups={variantProduct.variantGroups}
          onClose={() => setVariantProduct(null)}
          onConfirm={({ optionIds, label }) => addToCart(variantProduct, optionIds, label)}
        />
      )}
      {showMemberPicker && (
        <MemberPicker members={members} onClose={() => setShowMemberPicker(false)} onSelect={(m) => setMember(m)} />
      )}
      {showPayment && (
        <PaymentSheet total={total} member={member} onClose={() => setShowPayment(false)} onConfirm={(payments, memberId) => { setShowPayment(false); void checkout(payments, memberId); }} />
      )}
    </section>
  );
}
