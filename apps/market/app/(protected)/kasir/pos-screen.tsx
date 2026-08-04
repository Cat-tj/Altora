"use client";

import { useMemo, useState, useEffect, type KeyboardEvent } from "react";
import Link from "next/link";
import { formatRupiah } from "../../../lib/format";
import { ProductVisual } from "./product-visual";
import { PaymentSheet, type PaymentMethod } from "./payment-sheet";
import { VariantPickerModal, type VariantGroup } from "./variant-picker-modal";
import { MemberPicker, type MemberOption } from "./member-picker";
import { useToast, Toast } from "./toast";
import { XIcon } from "./icons";
import { createMarketSaleAction } from "./actions";

export type PosProduct = {
  id: string;
  name: string;
  sku: string | null;
  price: number;
  trackStock: boolean;
  stock: number;
  variantGroups: VariantGroup[];
};

export type CartLine = {
  cartKey: string;
  productId: string;
  name: string;
  price: number;
  qty: number;
  discountAmount: number;
  trackStock: boolean;
  stock: number;
  variantOptionIds: string[];
  variantLabel: string | null;
};

export function MarketPosScreen({
  products,
  shift,
  members,
}: {
  products: PosProduct[];
  shift: { id: string; outletName: string };
  members: MemberOption[];
}) {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("ALL");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [cartDiscount, setCartDiscount] = useState(0);
  const [showCartSheet, setShowCartSheet] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [variantPickerProduct, setVariantPickerProduct] = useState<PosProduct | null>(null);
  const [posMember, setPosMember] = useState<MemberOption | null>(null);
  const [showMemberPicker, setShowMemberPicker] = useState(false);

  const [requestId, setRequestId] = useState(() => crypto.randomUUID());
  const [result, setResult] = useState<{ error?: string; success?: string }>({});
  const { toastMessage, showToast } = useToast();

  // Category chips disabled — MarketPosProduct tidak punya categoryId
  const categories: { id: string; name: string; count: number }[] = [];

  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.filter((p) => {
      const matchCat = activeCategory === "ALL";
      const matchQ = !q || p.name.toLowerCase().includes(q) || (p.sku?.toLowerCase().includes(q) ?? false);
      return matchCat && matchQ;
    });
  }, [products, activeCategory, search]);

  const subtotal = cart.reduce((s, l) => s + l.price * l.qty - l.discountAmount, 0);
  const afterDiscount = Math.max(0, subtotal - cartDiscount);
  const total = afterDiscount;
  const cartCount = cart.reduce((s, l) => s + l.qty, 0);

  function addToCart(product: PosProduct, variantOptionIds: string[] = [], priceDelta = 0, variantLabel: string | null = null) {
    const cartKey = `${product.id}::${[...variantOptionIds].sort().join(",")}`;
    setCart((prev) => {
      const existing = prev.find((l) => l.cartKey === cartKey);
      const targetQty = existing ? existing.qty + 1 : 1;
      const clampedQty = product.trackStock ? Math.min(targetQty, product.stock) : targetQty;
      if (existing) return prev.map((l) => l.cartKey === cartKey ? { ...l, qty: clampedQty } : l);
      return [...prev, {
        cartKey, productId: product.id, name: product.name, price: product.price + priceDelta,
        qty: clampedQty, discountAmount: 0, trackStock: product.trackStock, stock: product.stock,
        variantOptionIds, variantLabel,
      }];
    });
  }

  function updateQty(cartKey: string, qty: number) {
    setCart((prev) => {
      if (qty <= 0) return prev.filter((l) => l.cartKey !== cartKey);
      return prev.map((l) => {
        if (l.cartKey !== cartKey) return l;
        const clamped = l.trackStock ? Math.min(qty, l.stock) : qty;
        return { ...l, qty: clamped };
      });
    });
  }

  function updateLineDiscount(cartKey: string, discount: number) {
    setCart((prev) => prev.map((l) => l.cartKey === cartKey ? { ...l, discountAmount: Math.max(0, discount) } : l));
  }

  function removeLine(cartKey: string) {
    setCart((prev) => prev.filter((l) => l.cartKey !== cartKey));
  }

  function handleSearchKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key !== "Enter") return;
    const q = search.trim().toLowerCase();
    if (!q) return;
    const found = products.find((p) => p.sku?.toLowerCase() === q);
    if (found) { addToCart(found); setSearch(""); }
    else showToast(`Barcode "${search.trim()}" tidak ditemukan`);
  }

  async function checkout(payments: { method: PaymentMethod; amount: number }[], memberId?: string) {
    setResult({});
    const single = payments.length === 1;
    const res = await createMarketSaleAction({
      shiftId: shift.id,
      requestId,
      items: cart.map((l) => ({ productId: l.productId, quantity: l.qty, variantOptionIds: l.variantOptionIds.length ? l.variantOptionIds : undefined })),
      paymentMethod: single ? payments[0]!.method : undefined,
      amountPaid: single ? payments[0]!.amount : undefined,
      payments: single ? undefined : payments,
      memberId,
    });
    if (res.error) { setResult({ error: res.error }); return; }
    setCart([]); setCartDiscount(0); setPosMember(null); setRequestId(crypto.randomUUID()); setShowPayment(false); setShowCartSheet(false);
    setResult({ success: `Transaksi ${res.sale!.invoiceNumber} tersimpan. Total ${formatRupiah(res.sale!.total)}${res.sale!.change ? `; kembalian ${formatRupiah(res.sale!.change)}.` : "."}` });
    showToast("Transaksi berhasil!");
  }

  // Global keyboard: fokus ke search
  useEffect(() => {
    const h = (e: globalThis.KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT" || t.isContentEditable) return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key.length === 1) (document.getElementById("pos-search-input") as HTMLInputElement)?.focus();
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between shrink-0">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--color-text)" }}>Kasir</h1>
          <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>{shift.outletName}</p>
        </div>
        <div className="flex flex-wrap gap-2 sm:justify-end">
          <Link href="/kasir/riwayat" className="flex min-h-[44px] flex-1 items-center justify-center rounded-lg border px-5 text-sm font-medium sm:flex-none" style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}>
            Riwayat
          </Link>
          <Link href="/kasir/tutup" className="flex min-h-[44px] flex-1 items-center justify-center rounded-lg border px-5 text-sm font-medium sm:flex-none" style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}>
            Tutup shift
          </Link>
        </div>
      </div>

      {result.error && <div className="mb-3 rounded-lg px-4 py-3 text-sm" style={{ backgroundColor: "var(--color-warning-bg)", color: "var(--color-warning-text)" }} role="alert">{result.error}</div>}
      {result.success && <div className="mb-3 rounded-lg px-4 py-3 text-sm" style={{ backgroundColor: "var(--color-good-bg)", color: "var(--color-good-text)" }} role="status">{result.success}</div>}

      {/* Main 2-col */}
      <div className="flex-1 flex flex-col md:grid md:grid-cols-[minmax(0,1fr)_minmax(280px,380px)] gap-4 overflow-hidden">
        {/* Products */}
        <div className="min-w-0 flex flex-col h-full overflow-hidden">
          {/* Search */}
          <div className="relative mb-3 shrink-0">
            <svg aria-hidden viewBox="0 0 24 24" className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2" style={{ color: "var(--color-text-secondary)" }} fill="none" stroke="currentColor" strokeWidth={2}>
              <circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" strokeLinecap="round" />
            </svg>
            <input
              id="pos-search-input"
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              placeholder="Cari nama produk, SKU, atau scan barcode"
              className="min-h-[48px] w-full rounded-xl border bg-white/70 pl-11 pr-4 text-sm outline-none transition-colors focus:bg-white focus:ring-2"
              style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}
            />
          </div>

          {/* Category chips */}
          <div className="mb-3 flex gap-2 overflow-x-auto pb-1 shrink-0" style={{ scrollbarWidth: "none" }}>
            <button onClick={() => setActiveCategory("ALL")} className="flex min-h-[42px] shrink-0 items-center gap-2 rounded-full border px-4 text-sm transition-all active:scale-[0.98]" style={activeCategory === "ALL" ? { borderColor: "var(--color-primary)", backgroundColor: "var(--color-primary)", color: "var(--color-on-primary)" } : { borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)", color: "var(--color-text)" }}>
              Semua <span className="text-xs">{products.length}</span>
            </button>
            {categories.map((c) => (
              <button key={c.id} onClick={() => setActiveCategory(c.id)} className="flex min-h-[42px] shrink-0 items-center gap-2 rounded-full border px-4 text-sm transition-all active:scale-[0.98]" style={activeCategory === c.id ? { borderColor: "var(--color-primary)", backgroundColor: "var(--color-primary)", color: "var(--color-on-primary)" } : { borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)", color: "var(--color-text)" }}>
                {c.name} <span className="text-xs">{c.count}</span>
              </button>
            ))}
          </div>

          {/* Product grid */}
          <div className="flex-1 overflow-y-auto pb-24 md:pb-0" style={{ scrollbarWidth: "none" }}>
            {filteredProducts.length === 0 ? (
              <div className="rounded-xl border px-6 py-16 text-center" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)" }}>
                <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>Produk tidak ditemukan.</p>
              </div>
            ) : (
              <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-3.5">
                {filteredProducts.map((product) => {
                  const linesForProduct = cart.filter((l) => l.productId === product.id);
                  const qtyInCart = linesForProduct.reduce((s, l) => s + l.qty, 0);
                  const outOfStock = product.trackStock && product.stock <= 0;
                  const atLimit = product.trackStock && qtyInCart >= product.stock;
                  const disabled = outOfStock || atLimit;
                  return (
                    <div
                      key={product.id}
                      role="button"
                      tabIndex={disabled ? -1 : 0}
                      onClick={() => { if (!disabled) addToCart(product); }}
                      onKeyDown={(e) => { if (!disabled && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); addToCart(product); } }}
                      className={`flex min-h-[112px] flex-col gap-3 rounded-xl border p-4 shadow-sm transition-all hover:shadow-md ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer active:scale-[0.98]"}`}
                      style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)" }}
                    >
                      <div className="flex items-start gap-3">
                        <ProductVisual product={product} />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[15px] font-semibold" style={{ color: "var(--color-text)" }}>{product.name}</p>
                          {product.sku && <p className="mt-0.5 truncate font-mono text-[11px]" style={{ color: "var(--color-text-secondary)" }}>{product.sku}</p>}
                          <div className="mt-1.5 flex items-center gap-2">
                            <p className="tabular-nums text-sm font-bold" style={{ color: "var(--color-text)" }}>{formatRupiah(product.price)}</p>
                            {product.trackStock && <p className="text-xs" style={{ color: outOfStock ? "var(--color-danger)" : "var(--color-text-secondary)" }}>{outOfStock ? "Stok habis" : `Stok ${product.stock}`}</p>}
                          </div>
                        </div>
                      </div>
                      {/* Qty stepper */}
                      <div onClick={(e) => e.stopPropagation()} className="flex items-center justify-center gap-2 rounded-full p-1 border" style={{ backgroundColor: "var(--color-bg)", borderColor: "var(--color-border)" }}>
                        <button type="button" onClick={() => { const line = [...cart].reverse().find((l) => l.productId === product.id); if (line) updateQty(line.cartKey, line.qty - 1); }} disabled={qtyInCart <= 0} className="flex h-8 w-8 items-center justify-center rounded-full border bg-white text-base font-bold disabled:opacity-30" style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}>−</button>
                        <span className="w-6 text-center tabular-nums text-sm font-bold" style={{ color: "var(--color-text)" }}>{qtyInCart}</span>
                        <button type="button" onClick={() => addToCart(product)} disabled={disabled} className="flex h-8 w-8 items-center justify-center rounded-full text-base font-bold text-white disabled:opacity-35" style={{ backgroundColor: "var(--color-primary)" }}>+</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Cart — mobile bottom bar + sheet */}
        <div className="hidden md:flex flex-col border rounded-xl p-4 bg-white" style={{ borderColor: "var(--color-border)" }}>
          <CartPanel cart={cart} cartDiscount={cartDiscount} setCartDiscount={setCartDiscount} subtotal={subtotal} total={total} onUpdateQty={updateQty} onUpdateLineDiscount={updateLineDiscount} onRemoveLine={removeLine} onCheckout={() => setShowPayment(true)} posMember={posMember} onPickMember={() => setShowMemberPicker(true)} onClearMember={() => setPosMember(null)} />
        </div>
      </div>

      {/* Mobile cart bar */}
      {cart.length > 0 && !showCartSheet && (
        <button onClick={() => setShowCartSheet(true)} className="fixed inset-x-4 bottom-20 z-20 flex min-h-[52px] items-center justify-between gap-3 rounded-xl px-5 text-white shadow-lg md:hidden" style={{ backgroundColor: "var(--color-primary)" }}>
          <span className="shrink-0 text-sm font-medium">{cartCount} item</span>
          <span className="min-w-0 truncate text-right tabular-nums text-base font-bold">Lihat Invoice • {formatRupiah(total)}</span>
        </button>
      )}

      {/* Mobile cart sheet */}
      {showCartSheet && (
        <div className="fixed inset-0 z-40 flex flex-col justify-end md:hidden" style={{ backgroundColor: "rgba(0,0,0,0.4)" }}>
          <div className="max-h-[85vh] w-full overflow-y-auto rounded-t-2xl p-4" style={{ backgroundColor: "var(--color-bg)" }}>
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-base font-bold" style={{ color: "var(--color-text)" }}>Invoice</h2>
              <button onClick={() => setShowCartSheet(false)} className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ color: "var(--color-text-secondary)" }}>
                <XIcon className="h-5 w-5" />
              </button>
            </div>
            <CartPanel cart={cart} cartDiscount={cartDiscount} setCartDiscount={setCartDiscount} subtotal={subtotal} total={total} onUpdateQty={updateQty} onUpdateLineDiscount={updateLineDiscount} onRemoveLine={removeLine} onCheckout={() => { setShowCartSheet(false); setShowPayment(true); }} posMember={posMember} onPickMember={() => setShowMemberPicker(true)} onClearMember={() => setPosMember(null)} />
          </div>
        </div>
      )}

      {/* Modals */}
      {showPayment && (
        <PaymentSheet
          total={total}
          initialMember={posMember} onClose={() => setShowPayment(false)}
          onConfirm={(payments, memberId) => { setShowPayment(false); void checkout(payments, memberId); }}
        />
      )}
      {variantPickerProduct && (
        <VariantPickerModal productName={variantPickerProduct.name} basePrice={variantPickerProduct.price} groups={variantPickerProduct.variantGroups}
          onClose={() => setVariantPickerProduct(null)} onConfirm={({ optionIds, priceDelta, label }) => addToCart(variantPickerProduct, optionIds, priceDelta, label)} />
      )}
      {showMemberPicker && (
        <MemberPicker members={members} onSelect={(m) => { setPosMember(m); setShowMemberPicker(false); }} onClose={() => setShowMemberPicker(false)} />
      )}
      <Toast message={toastMessage} />
    </div>
  );
}

/* ─── Cart Panel (shared by desktop sidebar + mobile sheet) ─── */
function CartPanel({
  cart, cartDiscount, setCartDiscount, subtotal, total, onUpdateQty, onUpdateLineDiscount, onRemoveLine, onCheckout, posMember, onPickMember, onClearMember,
}: {
  cart: CartLine[]; cartDiscount: number; setCartDiscount: (v: number) => void;
  subtotal: number; total: number;
  onUpdateQty: (key: string, qty: number) => void; onUpdateLineDiscount: (key: string, d: number) => void; onRemoveLine: (key: string) => void;
  onCheckout: () => void; posMember: MemberOption | null; onPickMember: () => void; onClearMember: () => void;
}) {
  return (
    <div className="flex flex-col h-full">
      {cart.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center py-6 text-center">
          <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>Belum ada produk. Ketuk produk untuk menambahkan →</p>
        </div>
      ) : (
        <div className="flex flex-1 flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto pr-0.5 mb-3 min-h-[180px] space-y-3" style={{ scrollbarWidth: "none" }}>
            {cart.map((line) => (
              <div key={line.cartKey} className="border-b pb-3 last:border-0 last:pb-0" style={{ borderColor: "var(--color-border)" }}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold" style={{ color: "var(--color-text)" }}>{line.name}</p>
                    {line.variantLabel && <p className="truncate text-xs" style={{ color: "var(--color-text-secondary)" }}>{line.variantLabel}</p>}
                    <p className="tabular-nums text-xs" style={{ color: "var(--color-text-secondary)" }}>{formatRupiah(line.price)} / item</p>
                  </div>
                  <button onClick={() => onRemoveLine(line.cartKey)} className="flex h-8 shrink-0 items-center gap-1 rounded-lg px-2 text-xs font-medium" style={{ color: "var(--color-danger)" }}>
                    <XIcon className="h-3.5 w-3.5" /> Hapus
                  </button>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => onUpdateQty(line.cartKey, line.qty - 1)} className="flex h-8 w-8 items-center justify-center rounded-lg border text-sm font-semibold" style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}>−</button>
                    <span className="min-w-[1.5rem] text-center tabular-nums text-sm font-bold" style={{ color: "var(--color-text)" }}>{line.qty}</span>
                    <button onClick={() => onUpdateQty(line.cartKey, line.qty + 1)} disabled={line.trackStock && line.qty >= line.stock} className="flex h-8 w-8 items-center justify-center rounded-lg border text-sm font-semibold disabled:opacity-40" style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}>+</button>
                  </div>
                  <span className="tabular-nums text-sm font-bold" style={{ color: "var(--color-text)" }}>{formatRupiah(line.price * line.qty - line.discountAmount)}</span>
                </div>
                <div className="mt-1.5 flex items-center gap-1.5">
                  <label className="text-xs font-medium" style={{ color: "var(--color-text-secondary)" }}>Diskon</label>
                  <input type="number" min={0} inputMode="numeric" value={line.discountAmount || ""} onChange={(e) => onUpdateLineDiscount(line.cartKey, Number(e.target.value) || 0)} placeholder="0" className="h-7 w-24 rounded border px-2 text-xs tabular-nums outline-none" style={{ borderColor: "var(--color-border)" }} />
                </div>
              </div>
            ))}
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto border-t pt-3 flex flex-col gap-3" style={{ borderColor: "var(--color-border)" }}>
            <div className="flex items-center justify-between gap-2">
              <label className="text-xs font-medium" style={{ color: "var(--color-text-secondary)" }}>Diskon transaksi</label>
              <input type="number" min={0} inputMode="numeric" value={cartDiscount || ""} onChange={(e) => setCartDiscount(Number(e.target.value) || 0)} placeholder="0" className="h-8 w-24 rounded border px-2 text-sm tabular-nums outline-none" style={{ borderColor: "var(--color-border)" }} />
            </div>
            {/* Member chip */}
            {posMember ? (
              <div className="flex items-center justify-between rounded-lg border px-3 py-2" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)" }}>
                <span className="text-sm font-medium" style={{ color: "var(--color-text)" }}>👤 {posMember.name}</span>
                <button type="button" onClick={onClearMember} className="text-xs font-semibold" style={{ color: "var(--color-primary)" }}>Ganti</button>
              </div>
            ) : (
              <button type="button" onClick={onPickMember} className="text-xs font-semibold" style={{ color: "var(--color-primary)" }}>+ Pilih member</button>
            )}
            {/* Summary */}
            <div className="rounded-xl p-3" style={{ backgroundColor: "var(--color-bg)" }}>
              <div className="flex justify-between text-xs" style={{ color: "var(--color-text-secondary)" }}>
                <span>Subtotal</span><span className="tabular-nums">{formatRupiah(subtotal)}</span>
              </div>
              <div className="mt-2 flex items-center justify-between gap-2 border-t pt-2" style={{ borderColor: "var(--color-border)" }}>
                <span className="shrink-0 text-xs font-semibold" style={{ color: "var(--color-text)" }}>Total belanja</span>
                <span className="truncate tabular-nums text-xl font-bold leading-tight" style={{ color: "var(--color-text)" }}>{formatRupiah(total)}</span>
              </div>
            </div>
            <button onClick={onCheckout} disabled={cart.length === 0} className="flex min-h-[52px] w-full items-center justify-center gap-1.5 rounded-xl px-3 text-sm font-bold text-white disabled:opacity-40 hover:opacity-95 transition-opacity" style={{ backgroundColor: "var(--color-primary)" }}>
              <span>Bayar</span><span className="truncate tabular-nums">• {formatRupiah(total)}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
