import assert from "node:assert/strict";
import test from "node:test";
import { getProduct, products } from "./product-catalog.js";

test("every launch product has a unique id, version, and valid host", () => {
  const ids = products.map((product) => product.id);
  assert.equal(new Set(ids).size, products.length);
  for (const product of products) {
    assert.match(product.version, /^\d+\.\d+\.\d+$/);
    assert.doesNotThrow(() => new URL(product.host));
    assert.match(product.appDirectory, /^[a-z-]+$/);
    assert.match(product.releaseTagPrefix, /^[a-z]+$/);
  }
});

test("getProduct returns a product and rejects unknown ids", () => {
  assert.equal(getProduct("resto").name, "Altora Resto");
  assert.throws(() => getProduct("factory"), /tidak dikenal/);
});
