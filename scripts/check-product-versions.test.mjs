import test from "node:test";
import { checkProductVersions } from "./check-product-versions.mjs";

test("application package versions match the product catalog", async () => {
  await checkProductVersions();
});
