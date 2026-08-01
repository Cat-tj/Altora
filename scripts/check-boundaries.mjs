import { readFile } from "node:fs/promises";
import { glob } from "node:fs/promises";

const forbiddenImports = [
  { app: "cafe", forbidden: /(?:from\s+["'][^"']*apps\/market|from\s+["'][^"']*@altora\/market)/ },
  { app: "market", forbidden: /(?:from\s+["'][^"']*apps\/cafe|from\s+["'][^"']*@altora\/cafe)/ },
];
const violations = [];

for (const rule of forbiddenImports) {
  for await (const file of glob(`apps/${rule.app}/**/*.{js,jsx,ts,tsx}`, { exclude: ["**/node_modules/**", "**/.next/**"] })) {
    const source = await readFile(file, "utf8");
    if (rule.forbidden.test(source)) violations.push(`${file} mengimpor source aplikasi ${rule.app === "cafe" ? "Market" : "Cafe"}.`);
  }
}

if (violations.length > 0) {
  console.error(violations.join("\n"));
  process.exit(1);
}

console.log("Batas aplikasi Cafe dan Market terjaga.");
