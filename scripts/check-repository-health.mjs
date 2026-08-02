import { access, readFile, readdir } from "node:fs/promises";
import { constants } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { products } from "../packages/core/src/product-catalog.js";

const repositoryRoot = resolve(fileURLToPath(new URL("..", import.meta.url)));
const templateMarker = "This is a [Next.js]";

async function exists(file) {
  try {
    await access(file, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

export async function inspectRepositoryHealth(root = repositoryRoot) {
  const appDirectories = (await readdir(resolve(root, "apps"), { withFileTypes: true }))
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);
  const expectedApps = products.map((product) => product.appDirectory);
  const missingReadmes = [];
  const templateReadmes = [];

  for (const product of products) {
    const readme = resolve(root, "apps", product.appDirectory, "README.md");
    if (!(await exists(readme))) {
      missingReadmes.push(product.appDirectory);
      continue;
    }
    if ((await readFile(readme, "utf8")).includes(templateMarker)) templateReadmes.push(product.appDirectory);
  }

  return {
    missingReadmes,
    templateReadmes,
    unknownProductApps: appDirectories.filter((directory) => !expectedApps.includes(directory)),
  };
}

async function main() {
  const result = await inspectRepositoryHealth();
  const problems = [
    ...result.missingReadmes.map((app) => `README produk belum ada: apps/${app}/README.md`),
    ...result.templateReadmes.map((app) => `README template Next.js belum diganti: apps/${app}/README.md`),
    ...result.unknownProductApps.map((app) => `apps/${app} belum terdaftar pada katalog produk`),
  ];
  if (problems.length > 0) {
    console.error(problems.join("\n"));
    process.exitCode = 1;
    return;
  }
  console.log("Manifest aplikasi dan dokumentasi produk konsisten.");
}

if (process.argv[1] === fileURLToPath(import.meta.url)) await main();
