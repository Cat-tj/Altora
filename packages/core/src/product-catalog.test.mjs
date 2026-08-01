import assert from "node:assert/strict";
import test from "node:test";
import { getProduct, products } from "./product-catalog.js";

test("every launch product has a unique id, version, and valid host", () => {
  const ids = products.map((product) => product.id);
  assert.equal(new Set(ids).size, products.length);
  for (const product of products) {
    assert.match(product.version, /^\d+\.\d+\.\d+$/);
    assert.doesNotThrow(() => new URL(product.host));
  }
});

test("getProduct returns a product and rejects unknown ids", () => {
  assert.equal(getProduct("market").name, "Altora Market");
  assert.throws(() => getProduct("factory"), /tidak dikenal/);
});
