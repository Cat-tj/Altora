import assert from "node:assert/strict";
import test from "node:test";
import { searchMarketCatalog } from "./catalog.js";

test("retail catalog searches by barcode and narrows by category", () => {
  assert.equal(searchMarketCatalog("8991002101034").at(0)?.name, "Mie Instan Goreng");
  assert.deepEqual(searchMarketCatalog("", "Minuman").map((item) => item.category), ["Minuman", "Minuman"]);
});

test("retail catalog returns no product for an unknown scan", () => {
  assert.deepEqual(searchMarketCatalog("barcode-tidak-ada"), []);
});
