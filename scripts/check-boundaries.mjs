import { readFile } from "node:fs/promises";
import { glob } from "node:fs/promises";

const productApps = ["landing", "resto", "market", "admin", "service"];
const violations = [];

// 1. Enforce No Cross-App Imports (apps/* -> apps/*)
for (const app of productApps) {
  const forbiddenApps = productApps.filter((candidate) => candidate !== app);
  const forbidden = new RegExp(
    `(?:from\\s+["'][^"']*(?:apps/(?:${forbiddenApps.join("|")})|@altora/(?:${forbiddenApps.join("|")}))["'])`,
  );
  for await (const file of glob(`apps/${app}/**/*.{js,jsx,ts,tsx}`, { exclude: ["**/node_modules/**", "**/.next/**"] })) {
    const source = await readFile(file, "utf8");
    if (forbidden.test(source)) violations.push(`${file}: Mengimpor source aplikasi produk lain.`);
  }
}

// 2. Enforce Packages cannot import from Apps (packages/* -> apps/*)
const forbiddenAppInPackages = new RegExp(`(?:from\\s+["'][^"']*apps/(?:${productApps.join("|")})["'])`);
for await (const file of glob(`packages/**/*.{js,jsx,ts,tsx,mjs}`, { exclude: ["**/node_modules/**", "**/.next/**"] })) {
  const source = await readFile(file, "utf8");
  if (forbiddenAppInPackages.test(source)) violations.push(`${file}: Shared package mengimpor dari apps/!`);
}

// 3. Enforce pos-core cannot import from vertical adapters (packages/pos-core -> market-pos/resto-pos/service-pos)
const forbiddenVerticalInPosCore = /(?:from\s+["'][^"']*(?:market-pos|resto-pos|service-pos)["'])/;
for await (const file of glob(`packages/pos-core/**/*.{js,jsx,ts,tsx,mjs}`, { exclude: ["**/node_modules/**"] })) {
  const source = await readFile(file, "utf8");
  if (forbiddenVerticalInPosCore.test(source)) violations.push(`${file}: pos-core mengimpor dari vertical adapter!`);
}

if (violations.length > 0) {
  console.error(violations.join("\n"));
  process.exit(1);
}

console.log("Batas arsitektur dan dependensi semua aplikasi & paket terjaga.");
