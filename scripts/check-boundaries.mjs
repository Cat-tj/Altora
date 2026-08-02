import { readFile } from "node:fs/promises";
import { glob } from "node:fs/promises";

const productApps = ["landing", "resto", "market", "admin"];
const violations = [];

for (const app of productApps) {
  const forbiddenApps = productApps.filter((candidate) => candidate !== app);
  const forbidden = new RegExp(
    `(?:from\\s+["'][^"']*(?:apps/(?:${forbiddenApps.join("|")})|@altora/(?:${forbiddenApps.join("|")}))["'])`,
  );
  for await (const file of glob(`apps/${app}/**/*.{js,jsx,ts,tsx}`, { exclude: ["**/node_modules/**", "**/.next/**"] })) {
    const source = await readFile(file, "utf8");
    if (forbidden.test(source)) violations.push(`${file} mengimpor source aplikasi produk lain.`);
  }
}

if (violations.length > 0) {
  console.error(violations.join("\n"));
  process.exit(1);
}

console.log("Batas semua aplikasi produk terjaga.");
