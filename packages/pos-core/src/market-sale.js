function assertPositiveInteger(value, label) {
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`${label} harus bilangan bulat lebih dari nol.`);
  }
}

function assertAmount(value, label) {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`${label} tidak valid.`);
  }
}

export function normalizeCheckoutRequestId(value) {
  const requestId = typeof value === "string" ? value.trim() : "";
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(requestId)) {
    throw new Error("ID transaksi tidak valid.");
  }
  return requestId.toLowerCase();
}

export function normalizeRetailCart(items) {
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error("Keranjang masih kosong.");
  }

  const quantities = new Map();
  for (const item of items) {
    const productId = item?.productId?.trim();
    if (!productId) throw new Error("Produk pada keranjang tidak valid.");
    assertPositiveInteger(item.quantity, "Jumlah produk");
    quantities.set(productId, (quantities.get(productId) ?? 0) + item.quantity);
  }

  return Object.freeze([...quantities].map(([productId, quantity]) => Object.freeze({ productId, quantity })));
}

export function normalizeCart(items) {
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error("Keranjang masih kosong.");
  }

  const quantities = new Map();
  for (const item of items) {
    const itemId = (item?.itemId || item?.productId)?.trim();
    if (!itemId) throw new Error("Item pada keranjang tidak valid.");
    assertPositiveInteger(item.quantity, "Jumlah item");
    quantities.set(itemId, (quantities.get(itemId) ?? 0) + item.quantity);
  }

  return Object.freeze([...quantities].map(([itemId, quantity]) => Object.freeze({ itemId, quantity })));
}

export function validatePayment({ method, total, amountPaid }) {
  assertAmount(total, "Total transaksi");
  assertAmount(amountPaid, "Pembayaran");
  if (method === "CASH") {
    if (amountPaid < total) throw new Error("Uang diterima kurang dari total belanja.");
    return Object.freeze({ amountPaid, change: amountPaid - total });
  }
  if (!["QRIS", "TRANSFER", "EWALLET", "DEBIT", "CREDIT"].includes(method)) {
    throw new Error("Metode pembayaran belum didukung.");
  }
  if (amountPaid !== total) {
    throw new Error("Jumlah pembayaran non-tunai harus sama persis dengan total tagihan.");
  }
  return Object.freeze({ amountPaid, change: 0 });
}

export const validateRetailPayment = validatePayment;
