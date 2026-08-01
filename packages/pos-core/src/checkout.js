function assertNonNegativeAmount(amount, label) {
  if (!Number.isFinite(amount) || amount < 0) throw new Error(`${label} harus berupa angka nol atau lebih.`);
}

export function calculateCheckout({ items, discount = 0, payment = 0 }) {
  assertNonNegativeAmount(discount, "Diskon");
  assertNonNegativeAmount(payment, "Pembayaran");
  const subtotal = items.reduce((total, item) => {
    assertNonNegativeAmount(item.unitPrice, "Harga item");
    assertNonNegativeAmount(item.quantity, "Jumlah item");
    return total + item.unitPrice * item.quantity;
  }, 0);
  const appliedDiscount = Math.min(discount, subtotal);
  const total = subtotal - appliedDiscount;
  return Object.freeze({ subtotal, discount: appliedDiscount, total, paid: payment, change: Math.max(payment - total, 0), remainder: Math.max(total - payment, 0) });
}
