export { calculateCheckout } from "@altora/pos-core";

export function createRestoOrderContext({ tableNumber, serviceType }) {
  if (!tableNumber && serviceType === "DINE_IN") throw new Error("Nomor meja wajib untuk pesanan makan di tempat.");
  return Object.freeze({ tableNumber: tableNumber ?? null, serviceType });
}
