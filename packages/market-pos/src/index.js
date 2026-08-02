export function createScannedRetailItem({ barcode, unit }) {
  if (!barcode?.trim()) throw new Error("Barcode produk wajib diisi.");
  if (!unit?.trim()) throw new Error("Satuan produk wajib diisi.");
  return Object.freeze({ barcode, unit });
}
