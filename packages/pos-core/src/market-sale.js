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

export function validateRetailPayment({ method, total, amountPaid }) {
  assertAmount(total, "Total transaksi");
  assertAmount(amountPaid, "Pembayaran");
  if (method === "CASH") {
    if (amountPaid < total) throw new Error("Uang diterima kurang dari total belanja.");
    return Object.freeze({ amountPaid, change: amountPaid - total });
  }
  if (!["QRIS", "TRANSFER", "EWALLET"].includes(method)) {
    throw new Error("Metode pembayaran belum didukung pada POS Market.");
  }
  if (amountPaid !== total) {
    throw new Error("Jumlah pembayaran non-tunai harus sama persis dengan total tagihan.");
  }
  return Object.freeze({ amountPaid, change: 0 });
}
