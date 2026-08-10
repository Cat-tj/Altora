"use client";

import { useMemo, useState, useEffect, useRef, type KeyboardEvent } from "react";
import Link from "next/link";
import { formatRupiah } from "../../../lib/format";
import { computeBestPromoDiscount, type PromoForCalc, type PromoCartLine } from "../../../lib/promo-calc";
import { ProductVisual } from "./product-visual";
import { PaymentSheet, type PaymentMethod } from "./payment-sheet";
import { VariantPickerModal, type VariantGroup } from "./variant-picker-modal";
import { MemberPicker, type MemberOption } from "./member-picker";
import { CameraBarcodeModal } from "./camera-barcode-modal";
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
  trackExpiry?: boolean;
  expiredAt?: string | null;
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
  isExpireDiscount?: boolean;
  expireDiscountPercent?: number;
};

export type ExpireDiscountSettings = {
  enabled: boolean;
  mode: "auto" | "manual";
  days: number;
  percent: number;
};

function checkNearExpiryDiscount(
  product: PosProduct,
  settings?: ExpireDiscountSettings
): { isNearExpiry: boolean; diffDays: number; discountPercent: number; discountAmount: number } | null {
  if (!settings?.enabled) return null;
  if (!product.trackExpiry || !product.expiredAt) return null;

  const expDate = new Date(product.expiredAt);
  const now = new Date();
  const diffTime = expDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 3600 * 24));

  if (diffDays > 0 && diffDays <= settings.days) {
    const pct = settings.percent;
    const discountAmount = Math.round(product.price * (pct / 100));
    return {
      isNearExpiry: true,
      diffDays,
      discountPercent: pct,
      discountAmount,
    };
  }

  return null;
}

function playScanBeep() {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.1);
  } catch {
    // Ignore audio autoplay restrictions
  }
}

export function MarketPosScreen({
  products,
  shift,
  members,
  promos = [],
  expireDiscountSettings,
}: {
  products: PosProduct[];
  shift: { id: string; outletName: string };
  members: MemberOption[];
  promos: PromoForCalc[];
  expireDiscountSettings?: ExpireDiscountSettings;
}) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [cartDiscount, setCartDiscount] = useState(0);
  const [showPayment, setShowPayment] = useState(false);
  const [showCartSheet, setShowCartSheet] = useState(false);
  const [variantProduct, setVariantProduct] = useState<PosProduct | null>(null);
  const [posMember, setPosMember] = useState<MemberOption | null>(null);
  const [showMemberPicker, setShowMemberPicker] = useState(false);
  const [showCameraScanner, setShowCameraScanner] = useState(false);
  const [lastScannedStatus, setLastScannedStatus] = useState<string | null>(null);
  const [autoFocusMode, setAutoFocusMode] = useState(true);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const { toastMessage, showToast } = useToast();

  const categories = useMemo(() => {
    const map = new Map<string, { id: string; name: string; count: number }>();
    for (const p of products) {
      if (!p.categoryId || !p.categoryName) continue;
      const cur = map.get(p.categoryId);
      if (cur) cur.count++;
      else map.set(p.categoryId, { id: p.categoryId, name: p.categoryName, count: 1 });
    }
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [products]);

  const filteredProducts = useMemo(() => {
    let list = products;
    if (selectedCategory) list = list.filter((p) => p.categoryId === selectedCategory);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((p) => p.name.toLowerCase().includes(q) || (p.sku && p.sku.toLowerCase().includes(q)));
    }
    return list;
  }, [products, selectedCategory, search]);

  const subtotal = cart.reduce((s, l) => s + l.price * l.qty - l.discountAmount, 0);
  const afterDiscount = Math.max(0, subtotal - cartDiscount);

  const promoCart: PromoCartLine[] = cart.map((l) => {
    const prod = products.find((p) => p.id === l.productId);
    return {
      productId: l.productId,
      categoryId: prod?.categoryId ?? null,
      lineTotal: l.price * l.qty - l.discountAmount,
      price: l.price,
      qty: l.qty,
      name: l.name,
    };
  });

  const promoResult = useMemo(
    () => computeBestPromoDiscount(promos, promoCart, subtotal),
    [promos, promoCart, subtotal],
  );

  const promoDiscountAmount = promoResult?.discountAmount || 0;
  const total = Math.max(0, afterDiscount - promoDiscountAmount);
  const cartCount = cart.reduce((s, l) => s + l.qty, 0);

  // Auto focus management for continuous scanning
  useEffect(() => {
    if (autoFocusMode && !showPayment && !variantProduct && !showMemberPicker && !showCameraScanner) {
      searchInputRef.current?.focus();
    }
  }, [autoFocusMode, showPayment, variantProduct, showMemberPicker, showCameraScanner]);

  useEffect(() => {
    function handleGlobalKeyDown(e: globalThis.KeyboardEvent) {
      if (!autoFocusMode || showPayment || variantProduct || showMemberPicker || showCameraScanner) return;
      const activeEl = document.activeElement;
      const isInput = activeEl?.tagName === "INPUT" || activeEl?.tagName === "TEXTAREA" || activeEl?.tagName === "SELECT";
      if (!isInput && e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        searchInputRef.current?.focus();
      }
    }
    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, [autoFocusMode, showPayment, variantProduct, showMemberPicker, showCameraScanner]);

  function handleCameraScan(barcode: string) {
    const q = barcode.trim().toLowerCase();
    if (!q) return;

    const exactMatch = products.find(
      (p) => (p.sku && p.sku.toLowerCase() === q) || p.name.toLowerCase() === q
    );

    const target = exactMatch || (filteredProducts.length === 1 ? filteredProducts[0] : null);

    if (target) {
      const qtyInCart = cart.filter((l) => l.productId === target.id).reduce((s, l) => s + l.qty, 0);
      const outOfStock = target.trackStock && target.stock <= 0;
      const atLimit = target.trackStock && qtyInCart >= target.stock;

      if (outOfStock) {
        setLastScannedStatus(`⚠️ Stok ${target.name} habis!`);
        showToast(`⚠️ Stok ${target.name} habis!`);
      } else if (atLimit) {
        setLastScannedStatus(`⚠️ Stok ${target.name} maksimal (${target.stock})`);
        showToast(`⚠️ Stok ${target.name} sudah maksimal (${target.stock})`);
      } else {
        if (target.variantGroups && target.variantGroups.length > 0) {
          setVariantProduct(target);
          setShowCameraScanner(false);
        } else {
          addToCart(target);
          playScanBeep();
          setLastScannedStatus(`✅ +1 ${target.name}`);
          showToast(`✅ +1 ${target.name}`);
        }
      }
    } else {
      setLastScannedStatus(`❌ Kode "${barcode}" tidak ditemukan`);
      showToast(`❌ Kode "${barcode}" tidak ditemukan`);
    }

    setTimeout(() => {
      setLastScannedStatus(null);
    }, 2500);
  }

  function handleSearchKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      const q = search.trim().toLowerCase();
      if (!q) return;

      // 1. Match exact SKU or exact product name
      const exactMatch = products.find(
        (p) => (p.sku && p.sku.toLowerCase() === q) || p.name.toLowerCase() === q
      );

      // 2. Fallback to single search match if filtered result is 1 product
      const target = exactMatch || (filteredProducts.length === 1 ? filteredProducts[0] : null);

      if (target) {
        const qtyInCart = cart.filter((l) => l.productId === target.id).reduce((s, l) => s + l.qty, 0);
        const outOfStock = target.trackStock && target.stock <= 0;
        const atLimit = target.trackStock && qtyInCart >= target.stock;

        if (outOfStock) {
          showToast(`⚠️ Stok ${target.name} habis!`);
        } else if (atLimit) {
          showToast(`⚠️ Stok ${target.name} sudah maksimal (${target.stock})`);
        } else {
          if (target.variantGroups && target.variantGroups.length > 0) {
            setVariantProduct(target);
          } else {
            addToCart(target);
            playScanBeep();
            showToast(`✅ +1 ${target.name}`);
          }
        }
        setSearch("");
      } else {
        showToast(`❌ Barcode / SKU "${search}" tidak ditemukan`);
        setSearch("");
      }

      if (autoFocusMode) {
        setTimeout(() => searchInputRef.current?.focus(), 50);
      }
    }
  }

  function productPromos(product: PosProduct) {
    return promos.filter((p) => {
      if (!p.qualifyingProductId && !p.qualifyingCategoryId) return true;
      if (p.qualifyingProductId && p.qualifyingProductId === product.id) return true;
      if (p.qualifyingCategoryId && p.qualifyingCategoryId === product.categoryId) return true;
      return false;
    });
  }

  function addToCart(product: PosProduct, variantOptionIds: string[] = [], priceDelta = 0, variantLabel: string | null = null) {
    const cartKey = `${product.id}::${[...variantOptionIds].sort().join(",")}`;
    const unitPrice = product.price + priceDelta;
    const expiryDiscount = checkNearExpiryDiscount(product, expireDiscountSettings);
    const isAutoDiscount = expiryDiscount && expireDiscountSettings?.mode === "auto";
    const unitDiscount = isAutoDiscount ? Math.round(unitPrice * (expiryDiscount.discountPercent / 100)) : 0;

    setCart((prev) => {
      const existing = prev.find((l) => l.cartKey === cartKey);
      const targetQty = existing ? existing.qty + 1 : 1;
      const clampedQty = product.trackStock ? Math.min(targetQty, product.stock) : targetQty;
      if (existing) {
        const newDiscount = isAutoDiscount ? unitDiscount * clampedQty : existing.discountAmount;
        return prev.map((l) => l.cartKey === cartKey ? { ...l, qty: clampedQty, discountAmount: newDiscount } : l);
      }
      return [...prev, {
        cartKey, productId: product.id, name: product.name, price: unitPrice,
        qty: clampedQty, discountAmount: unitDiscount * clampedQty, trackStock: product.trackStock, stock: product.stock,
        variantOptionIds, variantLabel,
        isExpireDiscount: Boolean(isAutoDiscount),
        expireDiscountPercent: expiryDiscount?.discountPercent,
      }];
    });
  }

  function updateQty(cartKey: string, qty: number) {
    setCart((prev) => {
      if (qty <= 0) return prev.filter((l) => l.cartKey !== cartKey);
      return prev.map((l) => {
        if (l.cartKey !== cartKey) return l;
        let newDiscount = l.discountAmount;
        if (l.isExpireDiscount && l.expireDiscountPercent) {
          const unitDiscount = Math.round(l.price * (l.expireDiscountPercent / 100));
          newDiscount = unitDiscount * qty;
        }
        return { ...l, qty, discountAmount: newDiscount };
      });
    });
  }

  function updateLineDiscount(cartKey: string, discount: number) {
    setCart((prev) => prev.map((l) => l.cartKey === cartKey ? { ...l, discountAmount: Math.max(0, discount) } : l));
  }

  function removeLine(cartKey: string) {
    setCart((prev) => prev.filter((l) => l.cartKey !== cartKey));
  }

  async function handlePaymentComplete(method: PaymentMethod, amountPaid: number) {
    const payload = {
      shiftId: shift.id,
      requestId: typeof window !== "undefined" && window.crypto?.randomUUID ? window.crypto.randomUUID() : `req_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      items: cart.map((l) => ({
        productId: l.productId,
        quantity: l.qty,
        variantOptionIds: l.variantOptionIds.length ? l.variantOptionIds : undefined,
        discountAmount: l.discountAmount || undefined,
      })),
      paymentMethod: method,
      amountPaid: method === "CASH" ? amountPaid : total,
      cartDiscount: cartDiscount || undefined,
      memberId: posMember?.id,
      appliedPromoId: promoResult?.promoId || undefined,
      promoDiscountAmount: promoDiscountAmount > 0 ? promoDiscountAmount : undefined,
    };

    const res = await createMarketSaleAction(payload);
    if (res.sale) {
      setCart([]);
      setCartDiscount(0);
      setPosMember(null);
      setShowPayment(false);
      showToast(res.sale.invoiceNumber ? `Transaksi ${res.sale.invoiceNumber} berhasil!` : "Transaksi berhasil!");
      return { ok: true, invoiceNumber: res.sale.invoiceNumber };
    } else {
      showToast(res.error || "Gagal memproses transaksi");
      return { ok: false, error: res.error || "Gagal memproses transaksi" };
    }
  }

  function handleProductClick(product: PosProduct) {
    if (product.variantGroups && product.variantGroups.length > 0) {
      setVariantProduct(product);
    } else {
      addToCart(product);
      playScanBeep();
      showToast(`✅ +1 ${product.name}`);
    }
  }

  return (
    <div className="pos-layout">
      {/* Toast alert */}
      {toastMessage && <Toast message={toastMessage} />}

      {/* Header bar */}
      <header className="pos-row pos-row-top">
        <div className="pos-search-wrap">
          <span className="pos-search-icon">🔍</span>
          <input
            ref={searchInputRef}
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            placeholder="Scan Barcode / ketik nama / SKU lalu tekan Enter…"
            className="pos-search-input"
          />
        </div>

        <div className="pos-actions">
          <button
            type="button"
            onClick={() => setShowCameraScanner(true)}
            className="pos-btn"
            style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: "0.8rem", padding: "6px 12px" }}
            title="Scan barcode menggunakan kamera HP / laptop"
          >
            <span>📷 Scan Kamera</span>
          </button>

          <button
            type="button"
            onClick={() => setAutoFocusMode(!autoFocusMode)}
            className={`pos-btn ${autoFocusMode ? "pos-btn-primary" : ""}`}
            title="Sistem akan otomatis mempertahankan fokus ke kolom scan barcode"
            style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: "0.8rem", padding: "6px 12px" }}
          >
            <span>{autoFocusMode ? "⚡ Scan Mode: ON" : "⏸️ Scan Mode: OFF"}</span>
          </button>

          <Link href="/kasir/riwayat" className="pos-btn">
            📋 Riwayat
          </Link>
          <Link href={`/kasir/tutup/${shift.id}`} className="pos-btn pos-btn-primary">
            🔒 Tutup Shift ({shift.outletName})
          </Link>
        </div>
      </header>

      {/* Main 2-column: catalog | cart */}
      <div className="pos-body">
        {/* Left: Products */}
        <section className="pos-products">
          {/* Category Chips */}
          <div className="pos-chips">
            <button
              type="button"
              onClick={() => setSelectedCategory(null)}
              className={`pos-chip ${selectedCategory === null ? "is-active" : ""}`}
            >
              Semua produk <span className="pos-chip-count">{products.length}</span>
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`pos-chip ${selectedCategory === cat.id ? "is-active" : ""}`}
              >
                {cat.name} <span className="pos-chip-count">{cat.count}</span>
              </button>
            ))}
          </div>

          {/* Product Grid */}
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
                  const expiryInfo = checkNearExpiryDiscount(product, expireDiscountSettings);

                  return (
                    <button
                      key={product.id}
                      type="button"
                      disabled={disabled}
                      onClick={() => { if (!disabled) handleProductClick(product); }}
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
                          {expiryInfo && (
                            <span className="pos-expire-badge">
                              🏷️ -{expiryInfo.discountPercent}% ({expiryInfo.diffDays}d)
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* Right: Cart */}
        <aside className="pos-cart-panel">
          <CartPanel
            cart={cart}
            cartDiscount={cartDiscount}
            setCartDiscount={setCartDiscount}
            subtotal={subtotal}
            total={total}
            promoDiscountAmount={promoDiscountAmount}
            promoName={promoResult?.promoName || null}
            onUpdateQty={updateQty}
            onUpdateLineDiscount={updateLineDiscount}
            onRemoveLine={removeLine}
            onCheckout={() => setShowPayment(true)}
            posMember={posMember}
            onPickMember={() => setShowMemberPicker(true)}
            onClearMember={() => setPosMember(null)}
          />
        </aside>
      </div>

      {/* Mobile cart bottom bar */}
      {cart.length > 0 && !showCartSheet && (
        <div className="fixed bottom-0 left-0 right-0 z-20 flex items-center justify-between border-t bg-white p-3 shadow-lg md:hidden">
          <div>
            <span className="shrink-0 text-sm font-medium">{cartCount} item</span>
            <p className="text-base font-bold" style={{ color: "var(--accent)" }}>{formatRupiah(total)}</p>
          </div>
          <button
            onClick={() => setShowCartSheet(true)}
            className="rounded-xl px-5 py-2.5 text-sm font-bold text-white shadow-sm"
            style={{ backgroundColor: "var(--accent)" }}
          >
            Lihat Keranjang
          </button>
        </div>
      )}

      {/* Variant Picker Modal */}
      {variantProduct && (
        <VariantPickerModal
          productName={variantProduct.name}
          basePrice={variantProduct.price}
          groups={variantProduct.variantGroups}
          onConfirm={({ optionIds, priceDelta, label }) => {
            addToCart(variantProduct, optionIds, priceDelta, label);
            playScanBeep();
            showToast(`✅ +1 ${variantProduct.name}`);
            setVariantProduct(null);
          }}
          onClose={() => setVariantProduct(null)}
        />
      )}

      {/* Member Picker Modal */}
      {showMemberPicker && (
        <MemberPicker
          members={members}
          onSelect={(m) => { setPosMember(m); setShowMemberPicker(false); }}
          onClose={() => setShowMemberPicker(false)}
        />
      )}

      {/* Camera Barcode Scanner Modal */}
      {showCameraScanner && (
        <CameraBarcodeModal
          onScan={handleCameraScan}
          onClose={() => setShowCameraScanner(false)}
          lastScannedItem={lastScannedStatus}
        />
      )}

      {/* Payment Sheet */}
      {showPayment && (
        <PaymentSheet
          total={total}
          initialMember={posMember ? { id: posMember.id, name: posMember.name, depositBalance: posMember.depositBalance || 0 } : null}
          onClose={() => setShowPayment(false)}
          onConfirm={(paymentsArr) => {
            const primaryPayment = paymentsArr[0];
            handlePaymentComplete(primaryPayment?.method || "CASH", primaryPayment?.amount || total);
          }}
        />
      )}
    </div>
  );
}

function CartPanel({
  cart,
  cartDiscount,
  setCartDiscount,
  subtotal,
  total,
  promoDiscountAmount,
  promoName,
  onUpdateQty,
  onUpdateLineDiscount,
  onRemoveLine,
  onCheckout,
  posMember,
  onPickMember,
  onClearMember,
}: {
  cart: CartLine[];
  cartDiscount: number;
  setCartDiscount: (v: number) => void;
  subtotal: number;
  total: number;
  promoDiscountAmount: number;
  promoName: string | null;
  onUpdateQty: (cartKey: string, qty: number) => void;
  onUpdateLineDiscount: (cartKey: string, discount: number) => void;
  onRemoveLine: (cartKey: string) => void;
  onCheckout: () => void;
  posMember: MemberOption | null;
  onPickMember: () => void;
  onClearMember: () => void;
}) {
  return (
    <div className="flex h-full flex-col p-4">
      {/* Cart Header */}
      <div className="pos-cart-header">
        <h2>Keranjang Belanja</h2>
        <span className="pos-cart-count">{cart.reduce((s, l) => s + l.qty, 0)} item</span>
      </div>

      {/* Member Selection */}
      <div className="my-2 rounded-xl border p-2.5" style={{ borderColor: "var(--market-line)", background: "#fafbfa" }}>
        {posMember ? (
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold" style={{ color: "var(--accent)" }}>👤 Member: {posMember.name}</span>
              <p className="text-xs text-gray-500">{posMember.phone} • Poin: {posMember.points || 0}</p>
            </div>
            <button onClick={onClearMember} className="text-xs text-red-500 underline font-semibold">Ganti</button>
          </div>
        ) : (
          <button onClick={onPickMember} className="w-full text-left text-xs font-bold text-teal-700 hover:underline">
            + Pilih Member / Pelanggan
          </button>
        )}
      </div>

      {cart.length === 0 ? (
        <div className="pos-empty flex-1">
          <span style={{ fontSize: "2.5rem" }}>🛒</span>
          <p>Keranjang masih kosong.</p>
          <span style={{ fontSize: "0.75rem", color: "var(--market-muted)" }}>Klik produk atau scan barcode untuk menambah ke keranjang.</span>
        </div>
      ) : (
        <div className="flex flex-1 flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto pr-0.5 mb-2 space-y-2" style={{ scrollbarWidth: "none" }}>
            {cart.map((line) => (
              <div key={line.cartKey} className="border-b pb-2 last:border-0 last:pb-0" style={{ borderColor: "var(--market-line)" }}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold" style={{ color: "var(--market-ink)" }}>{line.name}</p>
                    {line.variantLabel && <p className="truncate text-xs text-gray-500">{line.variantLabel}</p>}
                    <p className="tabular-nums text-xs text-gray-500">{formatRupiah(line.price)} / item</p>

                    {line.isExpireDiscount && line.expireDiscountPercent && (
                      <span style={{ fontSize: "0.68rem", fontWeight: 700, color: "#c2410c", background: "#ffedd5", padding: "1px 6px", borderRadius: 4, display: "inline-block", marginTop: 2 }}>
                        🏷️ Clearance (-{line.expireDiscountPercent}%)
                      </span>
                    )}
                  </div>
                  <button onClick={() => onRemoveLine(line.cartKey)} className="flex h-7 shrink-0 items-center gap-1 rounded-lg px-2 text-xs font-medium text-red-600">
                    <XIcon className="h-3.5 w-3.5" /> Hapus
                  </button>
                </div>

                <div className="mt-1.5 flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <button onClick={() => onUpdateQty(line.cartKey, line.qty - 1)} className="flex h-7 w-7 items-center justify-center rounded-lg border text-sm font-semibold">−</button>
                    <span className="min-w-[1.25rem] text-center tabular-nums text-sm font-bold">{line.qty}</span>
                    <button onClick={() => onUpdateQty(line.cartKey, line.qty + 1)} disabled={line.trackStock && line.qty >= line.stock} className="flex h-7 w-7 items-center justify-center rounded-lg border text-sm font-semibold disabled:opacity-40">+</button>
                  </div>
                  <span className="tabular-nums text-sm font-bold">{formatRupiah(line.price * line.qty - line.discountAmount)}</span>
                </div>

                {!line.isExpireDiscount && (
                  <div className="mt-1.5 flex items-center gap-1.5">
                    <label className="text-xs font-medium text-gray-500">Diskon/item (Rp)</label>
                    <input type="number" min={0} inputMode="numeric" value={line.discountAmount || ""} onChange={(e) => onUpdateLineDiscount(line.cartKey, Number(e.target.value) || 0)} placeholder="0" className="h-7 w-24 rounded border px-2 text-xs tabular-nums outline-none" style={{ borderColor: "var(--market-line)" }} />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Cart Summary */}
          <div className="border-t pt-3 space-y-2" style={{ borderColor: "var(--market-line)" }}>
            <div className="flex items-center justify-between text-xs text-gray-600">
              <span>Subtotal</span>
              <span className="tabular-nums font-semibold">{formatRupiah(subtotal)}</span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-600">Diskon Transaksi</span>
              <input type="number" min={0} inputMode="numeric" value={cartDiscount || ""} onChange={(e) => setCartDiscount(Number(e.target.value) || 0)} placeholder="0" className="h-7 w-24 rounded border px-2 text-xs tabular-nums text-right outline-none" style={{ borderColor: "var(--market-line)" }} />
            </div>

            {promoDiscountAmount > 0 && (
              <div className="flex items-center justify-between text-xs text-emerald-600 font-semibold">
                <span>Promo: {promoName || "Diskon Promo"}</span>
                <span className="tabular-nums">−{formatRupiah(promoDiscountAmount)}</span>
              </div>
            )}

            <div className="flex items-center justify-between border-t pt-2 text-base font-bold" style={{ borderColor: "var(--market-line)" }}>
              <span>Total</span>
              <span className="tabular-nums text-lg" style={{ color: "var(--accent)" }}>{formatRupiah(total)}</span>
            </div>

            <button
              onClick={onCheckout}
              disabled={cart.length === 0}
              className="flex min-h-[46px] w-full items-center justify-center gap-1.5 rounded-xl px-3 text-base font-bold text-white disabled:opacity-40 hover:opacity-95 transition-opacity"
              style={{ backgroundColor: "var(--accent)" }}
            >
              Bayar {formatRupiah(total)}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
