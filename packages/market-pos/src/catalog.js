export const marketCatalog = Object.freeze([
  { id: "m-001", name: "Air Mineral 600 ml", barcode: "8991002101010", unit: "Botol", price: 5000, stock: 84, category: "Minuman" },
  { id: "m-002", name: "Kopi Susu Botol", barcode: "8991002101027", unit: "Botol", price: 18000, stock: 22, category: "Minuman" },
  { id: "m-003", name: "Mie Instan Goreng", barcode: "8991002101034", unit: "Pcs", price: 3500, stock: 126, category: "Makanan" },
  { id: "m-004", name: "Roti Cokelat", barcode: "8991002101041", unit: "Pcs", price: 8500, stock: 9, category: "Makanan" },
  { id: "m-005", name: "Sabun Cuci Piring", barcode: "8991002101058", unit: "Botol", price: 14500, stock: 18, category: "Kebutuhan rumah" },
  { id: "m-006", name: "Tisu Wajah 200 Lembar", barcode: "8991002101065", unit: "Pack", price: 12000, stock: 33, category: "Kebutuhan rumah" },
]);

export function searchMarketCatalog(query = "", category = "Semua") {
  const normalizedQuery = query.trim().toLocaleLowerCase("id-ID");
  return marketCatalog.filter((product) => {
    const matchesCategory = category === "Semua" || product.category === category;
    const matchesQuery = !normalizedQuery || [product.name, product.barcode].some((value) => value.toLocaleLowerCase("id-ID").includes(normalizedQuery));
    return matchesCategory && matchesQuery;
  });
}
