export const products = [
  { id: "landing", name: "Altora", version: "0.1.0", host: "https://altora.my.id", type: "landing", appDirectory: "landing", releaseTagPrefix: "web" },
  { id: "resto", name: "Altora Resto", version: "0.1.0", host: "https://resto.altora.my.id", type: "application", appDirectory: "resto", releaseTagPrefix: "resto" },
  { id: "market", name: "Altora Market", version: "0.2.6", host: "https://market.altora.my.id", type: "application", appDirectory: "market", releaseTagPrefix: "market" },
  { id: "admin", name: "Altora Admin", version: "0.1.0", host: "https://admin.altora.my.id", type: "application", appDirectory: "admin", releaseTagPrefix: "admin" },
];

export function getProduct(productId) {
  const product = products.find((candidate) => candidate.id === productId);
  if (!product) throw new Error(`Produk Altora tidak dikenal: ${productId}`);
  return product;
}
