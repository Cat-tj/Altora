import assert from "node:assert/strict";
import test from "node:test";
import { calculateCheckout } from "./checkout.js";

test("calculates a deterministic receipt total and change", () => {
  assert.deepEqual(calculateCheckout({ items: [{ unitPrice: 20000, quantity: 2 }, { unitPrice: 5000, quantity: 1 }], discount: 3000, payment: 50000 }), { subtotal: 45000, discount: 3000, total: 42000, paid: 50000, change: 8000, remainder: 0 });
});

test("caps discount and rejects invalid money values", () => {
  assert.equal(calculateCheckout({ items: [{ unitPrice: 10000, quantity: 1 }], discount: 20000 }).total, 0);
  assert.throws(() => calculateCheckout({ items: [{ unitPrice: 10000, quantity: 1 }], payment: -1 }), /Pembayaran/);
});
