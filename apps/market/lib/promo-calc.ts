/**
 * Logika promo murni (tanpa akses database) supaya bisa dipakai di client
 * component (pos-screen) maupun server tanpa menyeret koneksi DB ke bundle.
 *
 * Mendukung tiga jenis rule (kolom "ruleType" di tabel Promo):
 * - "DISCOUNT"   : diskon persen (discountPercent) atau nominal (discountAmount)
 *                  pada total belanja, opsional dengan minimal belanja.
 * - "BOGO"       : beli qualifyingQty produk, dapat rewardQty produk gratis
 *                  (rewardDiscountPercent=100) atau diskon sebagian.
 * - "BULK"       : beli dalam jumlah banyak, item termurah di-qualifyQty dapat
 *                  diskon rewardDiscountPercent.
 */

export type PromoForCalc = {
  id: string;
  name: string;
  ruleType: "DISCOUNT" | "BOGO" | "BULK" | string | null;
  discountPercent: number | null;
  discountAmount: number | null;
  minPurchase: number;
  // BOGO / BULK
  qualifyingQty: number | null;
  rewardQty: number | null;
  qualifyingProductId: string | null;
  qualifyingCategoryId: string | null;
  rewardProductId: string | null;
  rewardCategoryId: string | null;
  rewardDiscountPercent: number | null;
  maxRewardQty: number | null;
};

export type PromoCartLine = {
  productId: string;
  categoryId: string | null;
  lineTotal: number;
  price: number;
  qty: number;
  name: string;
};

export type PromoResult = {
  promoId: string;
  promoName: string;
  discountAmount: number;
  appliedLines: { cartKey: string; discountAmount: number }[];
  label: string;
};

/** Menghitung diskon terbesar dari daftar promo aktif untuk keranjang saat ini. */
export function computeBestPromoDiscount(
  promos: PromoForCalc[],
  cart: PromoCartLine[],
  subtotal: number
): PromoResult | null {
  let best: PromoResult | null = null;

  for (const promo of promos) {
    const result = computePromoDiscount(promo, cart, subtotal);
    if (result && (!best || result.discountAmount > best.discountAmount)) {
      best = result;
    }
  }

  return best;
}

/** Menghitung diskon satu promo. Return null kalau syarat tidak terpenuhi. */
export function computePromoDiscount(
  promo: PromoForCalc,
  cart: PromoCartLine[],
  subtotal: number
): PromoResult | null {
  const rule = (promo.ruleType ?? "DISCOUNT").toUpperCase();
  const normalized = rule === "BUY_X_GET_Y" ? "BOGO" : rule;

  if (normalized === "BOGO") return computeBogo(promo, cart);
  if (normalized === "BULK") return computeBulk(promo, cart);
  return computeDiscount(promo, cart, subtotal);
}

/* ── DISCOUNT (persen / nominal) ─────────────────────────── */
function computeDiscount(
  promo: PromoForCalc,
  cart: PromoCartLine[],
  subtotal: number
): PromoResult | null {
  if (subtotal < promo.minPurchase) return null;

  let base = subtotal;
  let label = promo.name;

  // Scope kategori: hanya hitung item dalam kategori tersebut
  if (promo.qualifyingCategoryId) {
    const scoped = cart.filter((l) => l.categoryId === promo.qualifyingCategoryId);
    base = scoped.reduce((s, l) => s + l.lineTotal, 0);
    label = `${promo.name} (kategori terpilih)`;
  } else if (promo.qualifyingProductId) {
    const scoped = cart.filter((l) => l.productId === promo.qualifyingProductId);
    base = scoped.reduce((s, l) => s + l.lineTotal, 0);
    label = `${promo.name} (produk terpilih)`;
  }
  if (base <= 0) return null;

  const discountAmount =
    promo.discountPercent != null
      ? Math.round((base * promo.discountPercent) / 100)
      : Math.min(promo.discountAmount ?? 0, base);

  if (discountAmount <= 0) return null;
  return { promoId: promo.id, promoName: promo.name, discountAmount, appliedLines: [], label };
}

/* ── BOGO (beli N, dapat M gratis / diskon) ──────────────── */
function computeBogo(promo: PromoForCalc, cart: PromoCartLine[]): PromoResult | null {
  const qualifyingQty = promo.qualifyingQty ?? 2;
  const rewardQty = promo.rewardQty ?? 1;
  if (qualifyingQty <= 0) return null;

  // Kumpulkan kandidat yang memenuhi syarat (produk/kategori)
  let candidates = cart;
  if (promo.qualifyingProductId) {
    candidates = cart.filter((l) => l.productId === promo.qualifyingProductId);
  } else if (promo.qualifyingCategoryId) {
    candidates = cart.filter((l) => l.categoryId === promo.qualifyingCategoryId);
  }

  // Total qty & nilai kandidat
  const totalQty = candidates.reduce((s, l) => s + l.qty, 0);
  if (totalQty < qualifyingQty + rewardQty) return null;

  // Berapa set BOGO yang terpenuhi
  const fullSets = Math.floor(totalQty / (qualifyingQty + rewardQty));
  const maxSets = promo.maxRewardQty ?? Infinity;
  const sets = Math.min(fullSets, maxSets);
  if (sets <= 0) return null;

  // Item gratis = yang termurah dari kandidat (barang termurah biasanya yang digratiskan)
  // rewardDiscountPercent=100 → gratis penuh; selain itu diskon sebagian
  const discountPercent = promo.rewardDiscountPercent ?? 100;
  const sortedByPrice = [...candidates].sort((a, b) => a.price - b.price);
  const appliedLines: { cartKey: string; discountAmount: number }[] = [];
  let totalDiscount = 0;
  let rewardRemaining = sets * rewardQty;

  for (const line of sortedByPrice) {
    if (rewardRemaining <= 0) break;
    const take = Math.min(line.qty, rewardRemaining);
    const lineDiscount = Math.round((line.price * take * discountPercent) / 100);
    appliedLines.push({ cartKey: `bogo:${line.productId}:${line.price}`, discountAmount: lineDiscount });
    totalDiscount += lineDiscount;
    rewardRemaining -= take;
  }

  if (totalDiscount <= 0) return null;
  return {
    promoId: promo.id,
    promoName: promo.name,
    discountAmount: totalDiscount,
    appliedLines,
    label: `${promo.name} (${sets}× gratis)`,
  };
}

/* ── BULK (beli banyak, item termurah didiskon) ──────────── */
function computeBulk(promo: PromoForCalc, cart: PromoCartLine[]): PromoResult | null {
  const qualifyingQty = promo.qualifyingQty ?? 5;
  if (qualifyingQty <= 0) return null;

  let candidates = cart;
  if (promo.qualifyingProductId) {
    candidates = cart.filter((l) => l.productId === promo.qualifyingProductId);
  } else if (promo.qualifyingCategoryId) {
    candidates = cart.filter((l) => l.categoryId === promo.qualifyingCategoryId);
  }

  const totalQty = candidates.reduce((s, l) => s + l.qty, 0);
  if (totalQty < qualifyingQty) return null;

  // Item termurah yang kena diskon
  const discountPercent = promo.rewardDiscountPercent ?? 10;
  const cheapest = [...candidates].sort((a, b) => a.price - b.price)[0];
  if (!cheapest) return null;

  const discountAmount = Math.round((cheapest.price * discountPercent) / 100);
  if (discountAmount <= 0) return null;

  return {
    promoId: promo.id,
    promoName: promo.name,
    discountAmount,
    appliedLines: [{ cartKey: `bulk:${cheapest.productId}:${cheapest.price}`, discountAmount }],
    label: `${promo.name} (${discountPercent}% item termurah)`,
  };
}
