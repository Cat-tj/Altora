import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { getProduct } from "@altora/core/product-catalog";

const appProducts = [
  ["apps/landing/package.json", "landing"],
  ["apps/cafe/package.json", "cafe"],
  ["apps/market/package.json", "market"],
  ["apps/admin/package.json", "admin"],
];

export async function checkProductVersions() {
  for (const [file, productId] of appProducts) {
    const packageJson = JSON.parse(await readFile(file, "utf8"));
    const product = getProduct(productId);
    assert.equal(packageJson.version, product.version, `${file} harus memiliki versi ${product.version}`);
  }
}

if (process.argv[1]?.endsWith("check-product-versions.mjs")) {
  await checkProductVersions();
  console.log("Versi aplikasi cocok dengan katalog produk.");
}
