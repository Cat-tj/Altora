export const products = [
  { id: "landing", name: "Altora", version: "0.1.0", host: "https://altora.my.id", type: "landing" },
  { id: "cafe", name: "Altora Cafe", version: "0.1.0", host: "https://cafe.altora.my.id", type: "application" },
  { id: "market", name: "Altora Market", version: "0.1.0", host: "https://market.altora.my.id", type: "application" },
  { id: "admin", name: "Altora Admin", version: "0.1.0", host: "https://admin.altora.my.id", type: "application" },
];

export function getProduct(productId) {
  const product = products.find((candidate) => candidate.id === productId);
  if (!product) throw new Error(`Produk Altora tidak dikenal: ${productId}`);
  return product;
}
