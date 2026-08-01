import assert from "node:assert/strict";
import test from "node:test";
import { createRestoOrderContext } from "./index.js";

test("dine-in order needs a table while takeaway does not", () => {
  assert.deepEqual(createRestoOrderContext({ tableNumber: "Meja 7", serviceType: "DINE_IN" }), { tableNumber: "Meja 7", serviceType: "DINE_IN" });
  assert.deepEqual(createRestoOrderContext({ serviceType: "TAKEAWAY" }), { tableNumber: null, serviceType: "TAKEAWAY" });
  assert.throws(() => createRestoOrderContext({ serviceType: "DINE_IN" }), /Nomor meja/);
});
