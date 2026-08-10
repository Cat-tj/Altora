import { describe, it } from "node:test";
import * as assert from "node:assert/strict";
import { computeBestPromoDiscount, computePromoDiscount, type PromoForCalc, type PromoCartLine } from "./promo-calc";

const cart: PromoCartLine[] = [
  { productId: "p1", categoryId: "c1", lineTotal: 6000, price: 6000, qty: 1, name: "Air Mineral" },
  { productId: "p2", categoryId: "c1", lineTotal: 20000, price: 20000, qty: 1, name: "Americano" },
];

describe("promo-calc DISCOUNT", () => {
  it("menghitung diskon persen dari subtotal", () => {
    const promo: PromoForCalc = {
      id: "d1", name: "Gajian 10%", ruleType: "DISCOUNT",
      discountPercent: 10, discountAmount: null, minPurchase: 0,
      qualifyingQty: null, rewardQty: null, qualifyingProductId: null, qualifyingCategoryId: null,
      rewardProductId: null, rewardCategoryId: null, rewardDiscountPercent: null, maxRewardQty: null,
    };
    const result = computePromoDiscount(promo, cart, 26000);
    assert.ok(result);
    assert.equal(result!.discountAmount, 2600);
  });

  it("tidak aktif kalau di bawah minimal belanja", () => {
    const promo: PromoForCalc = {
      id: "d2", name: "Gajian 10%", ruleType: "DISCOUNT",
      discountPercent: 10, discountAmount: null, minPurchase: 100000,
      qualifyingQty: null, rewardQty: null, qualifyingProductId: null, qualifyingCategoryId: null,
      rewardProductId: null, rewardCategoryId: null, rewardDiscountPercent: null, maxRewardQty: null,
    };
    assert.equal(computePromoDiscount(promo, cart, 26000), null);
  });
});

describe("promo-calc BOGO", () => {
  it("beli 2 gratis 1 — diskon item termurah", () => {
    const promo: PromoForCalc = {
      id: "b1", name: "Beli 2 Gratis 1", ruleType: "BOGO",
      discountPercent: null, discountAmount: null, minPurchase: 0,
      qualifyingQty: 2, rewardQty: 1, qualifyingProductId: null, qualifyingCategoryId: null,
      rewardProductId: null, rewardCategoryId: null, rewardDiscountPercent: 100, maxRewardQty: null,
    };
    // 3 item (2x Air Mineral 6000 + 1x Americano 20000) → gratis yang termurah: Air Mineral 6000
    const cart3: PromoCartLine[] = [
      { productId: "p1", categoryId: "c1", lineTotal: 12000, price: 6000, qty: 2, name: "Air Mineral" },
      { productId: "p2", categoryId: "c1", lineTotal: 20000, price: 20000, qty: 1, name: "Americano" },
    ];
    const result = computePromoDiscount(promo, cart3, 32000);
    assert.ok(result);
    assert.equal(result!.discountAmount, 6000);
  });

  it("2 set BOGO = 2x gratis", () => {
    const promo: PromoForCalc = {
      id: "b2", name: "Beli 2 Gratis 1", ruleType: "BOGO",
      discountPercent: null, discountAmount: null, minPurchase: 0,
      qualifyingQty: 2, rewardQty: 1, qualifyingProductId: null, qualifyingCategoryId: null,
      rewardProductId: null, rewardCategoryId: null, rewardDiscountPercent: 100, maxRewardQty: null,
    };
    const cart6: PromoCartLine[] = [
      { productId: "p1", categoryId: "c1", lineTotal: 36000, price: 6000, qty: 6, name: "Air Mineral" },
    ];
    const result = computePromoDiscount(promo, cart6, 36000);
    assert.ok(result);
    assert.equal(result!.discountAmount, 12000); // 2x Air Mineral gratis
  });

  it("tidak cukup item → null", () => {
    const promo: PromoForCalc = {
      id: "b3", name: "Beli 2 Gratis 1", ruleType: "BOGO",
      discountPercent: null, discountAmount: null, minPurchase: 0,
      qualifyingQty: 2, rewardQty: 1, qualifyingProductId: null, qualifyingCategoryId: null,
      rewardProductId: null, rewardCategoryId: null, rewardDiscountPercent: 100, maxRewardQty: null,
    };
    assert.equal(computePromoDiscount(promo, cart, 26000), null); // cuma 2 item
  });
});

describe("promo-calc BULK", () => {
  it("beli 5+ → item termurah diskon 10%", () => {
    const promo: PromoForCalc = {
      id: "k1", name: "Beli 5 Murah", ruleType: "BULK",
      discountPercent: null, discountAmount: null, minPurchase: 0,
      qualifyingQty: 5, rewardQty: null, qualifyingProductId: null, qualifyingCategoryId: null,
      rewardProductId: null, rewardCategoryId: null, rewardDiscountPercent: 10, maxRewardQty: null,
    };
    const cart5: PromoCartLine[] = [
      { productId: "p1", categoryId: "c1", lineTotal: 30000, price: 6000, qty: 5, name: "Air Mineral" },
    ];
    const result = computePromoDiscount(promo, cart5, 30000);
    assert.ok(result);
    assert.equal(result!.discountAmount, 600);
  });
});

describe("promo-calc best", () => {
  it("pilih diskon terbesar dari beberapa promo", () => {
    const promo10: PromoForCalc = {
      id: "d1", name: "10%", ruleType: "DISCOUNT",
      discountPercent: 10, discountAmount: null, minPurchase: 0,
      qualifyingQty: null, rewardQty: null, qualifyingProductId: null, qualifyingCategoryId: null,
      rewardProductId: null, rewardCategoryId: null, rewardDiscountPercent: null, maxRewardQty: null,
    };
    const promoFixed: PromoForCalc = {
      id: "d2", name: "Potong 1000", ruleType: "DISCOUNT",
      discountPercent: null, discountAmount: 1000, minPurchase: 0,
      qualifyingQty: null, rewardQty: null, qualifyingProductId: null, qualifyingCategoryId: null,
      rewardProductId: null, rewardCategoryId: null, rewardDiscountPercent: null, maxRewardQty: null,
    };
    const best = computeBestPromoDiscount([promo10, promoFixed], cart, 26000);
    assert.ok(best);
    assert.equal(best!.promoId, "d1"); // 2600 > 1000
  });
});
