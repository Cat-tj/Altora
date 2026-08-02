import assert from "node:assert/strict";
import test from "node:test";
import { normalizeRetailCart, validateRetailPayment } from "./market-sale.js";

test("normalizes duplicate retail cart lines into a single stock demand", () => {
  assert.deepEqual(
    normalizeRetailCart([
      { productId: "p-air", quantity: 1 },
      { productId: "p-air", quantity: 2 },
      { productId: "p-roti", quantity: 1 },
    ]),
    [
      { productId: "p-air", quantity: 3 },
      { productId: "p-roti", quantity: 1 },
    ],
  );
});

test("rejects an empty, fractional, or malformed retail cart before checkout", () => {
  assert.throws(() => normalizeRetailCart([]), /Keranjang masih kosong/);
  assert.throws(() => normalizeRetailCart([{ productId: "p-air", quantity: 1.5 }]), /bilangan bulat/);
  assert.throws(() => normalizeRetailCart([{ productId: "", quantity: 1 }]), /Produk/);
});

test("requires exact digital payment and sufficient cash", () => {
  assert.deepEqual(validateRetailPayment({ method: "CASH", total: 15000, amountPaid: 20000 }), { amountPaid: 20000, change: 5000 });
  assert.deepEqual(validateRetailPayment({ method: "QRIS", total: 15000, amountPaid: 15000 }), { amountPaid: 15000, change: 0 });
  assert.throws(() => validateRetailPayment({ method: "CASH", total: 15000, amountPaid: 14000 }), /kurang/);
  assert.throws(() => validateRetailPayment({ method: "QRIS", total: 15000, amountPaid: 16000 }), /sama persis/);
});
