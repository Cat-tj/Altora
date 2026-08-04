"use client";

import { useMemo, useState, useEffect, type KeyboardEvent } from "react";
import Link from "next/link";
import { formatRupiah } from "../../../lib/format";
import { computeBestPromoDiscount, type PromoForCalc, type PromoCartLine } from "../../../lib/promo-calc";
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
  categoryId: string | null;
  categoryName: string | null;
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
  promos = [],
}: {
  products: PosProduct[];
  shift: { id: string; outletName: string };
  members: MemberOption[];
  promos: PromoForCalc[];
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

  // Category chips dari data produk asli
  const categories = useMemo(() => {
    const map = new Map<string, { id: string; name: string; count: number }>();
    for (const p of products) {
      if (!p.categoryId || !p.categoryName) continue;
      const key = p.categoryId;
      const existing = map.get(key);
      if (existing) existing.count += 1;
      else map.set(key, { id: key, name: p.categoryName, count: 1 });
    }
    return Array.from(map.values()).sort((a, b) => b.count - a.count);
  }, [products]);

  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.filter((p) => {
      const matchCat = activeCategory === "ALL" || p.categoryId === activeCategory;
      const matchQ = !q || p.name.toLowerCase().includes(q) || (p.sku?.toLowerCase().includes(q) ?? false);
      return matchCat && matchQ;
    });
  }, [products, activeCategory, search]);

  const subtotal = cart.reduce((s, l) => s + l.price * l.qty - l.discountAmount, 0);
  const afterDiscount = Math.max(0, subtotal - cartDiscount);

  // Promo aktif — hitung diskon terbesar (BOGO / diskon / bulk)
  const activePromos = promos;
  const promoCart: PromoCartLine[] = cart.map((l) => {
    const product = products.find((p) => p.id === l.productId);
    return {
      productId: l.productId,
      categoryId: product?.categoryId ?? null,
      lineTotal: l.price * l.qty,
      price: l.price,
      qty: l.qty,
      name: l.name,
    };
  });
  const promoResult = computeBestPromoDiscount(activePromos, promoCart, afterDiscount);
  const promoDiscount = promoResult?.discountAmount ?? 0;
  const total = Math.max(0, afterDiscount - promoDiscount);
  const cartCount = cart.reduce((s, l) => s + l.qty, 0);

  // Badge promo per produk
  function productPromos(product: PosProduct): PromoForCalc[] {
    return activePromos.filter((p) => {
      const rule = (p.ruleType ?? "DISCOUNT").toUpperCase();
      const normalized = rule === "BUY_X_GET_Y" ? "BOGO" : rule;
      if (normalized === "BOGO" || normalized === "BULK") {
        if (p.qualifyingProductId && p.qualifyingProductId !== product.id) return false;
        if (p.qualifyingCategoryId && p.qualifyingCategoryId !== product.categoryId) return false;
        return true;
      }
      return false;
    });
  }

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
      items: cart.map((l) => ({ productId: l.productId, quantity: l.qty, variantOptionIds: l.variantOptionIds.length ? l.variantOptionIds : undefined, discountAmount: l.discountAmount || undefined })),
      paymentMethod: single ? payments[0]!.method : undefined,
      amountPaid: single ? payments[0]!.amount : undefined,
      payments: single ? undefined : payments,
      memberId,
      cartDiscount: cartDiscount || undefined,
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
    <div className="pos-layout">
      {/* Row 1: search + actions */}
      <div className="pos-row pos-row-top">
        <div className="pos-search-wrap">
          <svg aria-hidden viewBox="0 0 24 24" className="pos-search-icon" fill="none" stroke="currentColor" strokeWidth={2}>
            <circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" strokeLinecap="round" />
          </svg>
          <input
            id="pos-search-input"
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            placeholder="Cari produk atau scan barcode…"
            className="pos-search-input"
          />
        </div>
        <div className="pos-actions">
          <Link href="/kasir/riwayat" className="pos-btn">Riwayat</Link>
          <Link href="/kasir/tutup" className="pos-btn pos-btn-primary">Tutup Shift</Link>
        </div>
      </div>

      {result.error && <div className="mb-3 rounded-lg px-4 py-3 text-sm" style={{ backgroundColor: "var(--color-warning-bg)", color: "var(--color-warning-text)" }} role="alert">{result.error}</div>}
      {result.success && <div className="mb-3 rounded-lg px-4 py-3 text-sm" style={{ backgroundColor: "var(--color-good-bg)", color: "var(--color-good-text)" }} role="status">{result.success}</div>}

      {/* Main 2-col: products + cart */}
      <div className="pos-body">
        {/* Products */}
        <div className="pos-products">
          {/* Category chips */}
          <div className="pos-chips">
            <button onClick={() => setActiveCategory("ALL")} className="pos-chip" style={activeCategory === "ALL" ? { backgroundColor: "var(--accent)", color: "var(--accent-ink, #fff)", borderColor: "var(--accent)" } : {}}>
              Semua <span className="pos-chip-count">{products.length}</span>
            </button>
            {categories.map((c) => (
              <button key={c.id} onClick={() => setActiveCategory(c.id)} className="pos-chip" style={activeCategory === c.id ? { backgroundColor: "var(--accent)", color: "var(--accent-ink, #fff)", borderColor: "var(--accent)" } : {}}>
                {c.name} <span className="pos-chip-count">{c.count}</span>
              </button>
            ))}
          </div>

          {/* Product grid */}
          <div className="pos-grid-scroll">
            {filteredProducts.length === 0 ? (
              <div className="pos-empty">
                <p>Produk tidak ditemukan.</p>
              </div>
            ) : (
              <div className="pos-grid">
                {filteredProducts.map((product) => {
                  const qtyInCart = cart.filter((l) => l.productId === product.id).reduce((s, l) => s + l.qty, 0);
                  const outOfStock = product.trackStock && product.stock <= 0;
                  const atLimit = product.trackStock && qtyInCart >= product.stock;
                  const disabled = outOfStock || atLimit;
                  const promos = disabled ? [] : productPromos(product);
                  return (
                    <button
                      key={product.id}
                      type="button"
                      disabled={disabled}
                      onClick={() => { if (!disabled) addToCart(product); }}
                      className={`pos-card ${outOfStock ? "pos-card-out" : ""}`}
                    >
                      <div className="pos-card-top">
                        <ProductVisual product={product} />
                        {qtyInCart > 0 && <span className="pos-card-qty">{qtyInCart}</span>}
                        {outOfStock && <span className="pos-card-ribbon">Habis</span>}
                      </div>
                      <div className="pos-card-info">
                        <p className="pos-card-name">{product.name}</p>
                        {product.sku && <p className="pos-card-sku">{product.sku}</p>}
                        <p className="pos-card-price">{formatRupiah(product.price)}</p>
                        <div className="pos-card-meta">
                          <span className={outOfStock ? "pos-stock pos-stock-out" : "pos-stock"}>
                            {product.trackStock ? (outOfStock ? "Stok habis" : `Stok ${product.stock}`) : "Tanpa stok"}
                          </span>
                          {promos.length > 0 && (
                            <span className="pos-promo-badge">{promos[0]?.name}</span>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Cart — desktop sidebar */}
        <aside className="pos-cart-panel">
          <CartPanel cart={cart} cartDiscount={cartDiscount} setCartDiscount={setCartDiscount} subtotal={subtotal} total={total} promoResult={promoResult} onUpdateQty={updateQty} onUpdateLineDiscount={updateLineDiscount} onRemoveLine={removeLine} onCheckout={() => setShowPayment(true)} posMember={posMember} onPickMember={() => setShowMemberPicker(true)} onClearMember={() => setPosMember(null)} />
        </aside>
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
            <CartPanel cart={cart} cartDiscount={cartDiscount} setCartDiscount={setCartDiscount} subtotal={subtotal} total={total} promoResult={promoResult} onUpdateQty={updateQty} onUpdateLineDiscount={updateLineDiscount} onRemoveLine={removeLine} onCheckout={() => { setShowCartSheet(false); setShowPayment(true); }} posMember={posMember} onPickMember={() => setShowMemberPicker(true)} onClearMember={() => setPosMember(null)} />
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
  cart, cartDiscount, setCartDiscount, subtotal, total, promoResult, onUpdateQty, onUpdateLineDiscount, onRemoveLine, onCheckout, posMember, onPickMember, onClearMember,
}: {
  cart: CartLine[]; cartDiscount: number; setCartDiscount: (v: number) => void;
  subtotal: number; total: number;
  promoResult: { promoId: string; promoName: string; discountAmount: number; label: string } | null;
  onUpdateQty: (key: string, qty: number) => void; onUpdateLineDiscount: (key: string, d: number) => void; onRemoveLine: (key: string) => void;
  onCheckout: () => void; posMember: MemberOption | null; onPickMember: () => void; onClearMember: () => void;
}) {
  return (
    <div className="flex flex-col h-full">
      <div className="pos-cart-header">
        <h2>Keranjang</h2>
        <span className="pos-cart-count">{cart.reduce((s, l) => s + l.qty, 0)} item</span>
      </div>
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
                  <label className="text-xs font-medium" style={{ color: "var(--color-text-secondary)" }}>Diskon/item (Rp)</label>
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
              {cartDiscount > 0 && (
                <div className="mt-1 flex justify-between text-xs" style={{ color: "var(--color-good-text, #15803d)" }}>
                  <span>Diskon transaksi</span><span className="tabular-nums">−{formatRupiah(cartDiscount)}</span>
                </div>
              )}
              {promoResult && (
                <div className="mt-1 flex justify-between text-xs" style={{ color: "var(--color-good-text, #15803d)" }}>
                  <span className="truncate pr-2">🎉 {promoResult.label}</span><span className="tabular-nums shrink-0">−{formatRupiah(promoResult.discountAmount)}</span>
                </div>
              )}
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
