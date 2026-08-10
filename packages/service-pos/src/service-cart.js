import { calculateCheckout } from "@altora/pos-core";

/**
 * @typedef {Object} ServiceCartItem
 * @property {string} id
 * @property {string} name
 * @property {'SERVICE' | 'RETAIL'} itemType
 * @property {number} price
 * @property {number} quantity
 * @property {number} [durationMinutes]
 * @property {string} [assignedStaffId]
 * @property {string} [assignedStaffName]
 * @property {number} [commissionRate] -- e.g. 0.10 for 10%
 * @property {Array<{ productId: string, quantity: number }>} [consumedProducts] -- e.g. dye/developer for coloring
 */

/**
 * Normalize and validate a Service POS cart (supporting Services + Retail Products).
 * 
 * @param {ServiceCartItem[]} items
 * @returns {ReadonlyArray<ServiceCartItem>}
 */
export function normalizeServiceCart(items) {
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error("Keranjang layanan masih kosong.");
  }

  return Object.freeze(
    items.map((item) => {
      if (!item.id || !item.name) {
        throw new Error("Item layanan tidak valid.");
      }
      if (!Number.isFinite(item.price) || item.price < 0) {
        throw new Error(`Harga untuk item '${item.name}' tidak valid.`);
      }
      if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
        throw new Error(`Jumlah untuk item '${item.name}' harus lebih dari 0.`);
      }
      if (item.itemType === 'SERVICE' && !item.assignedStaffId) {
        throw new Error(`Layanan '${item.name}' membutuhkan penugasan staf.`);
      }

      return Object.freeze({
        id: item.id.trim(),
        name: item.name.trim(),
        itemType: item.itemType || 'SERVICE',
        price: item.price,
        quantity: item.quantity,
        durationMinutes: item.durationMinutes || 0,
        assignedStaffId: item.assignedStaffId || null,
        assignedStaffName: item.assignedStaffName || null,
        commissionRate: item.commissionRate || 0,
        consumedProducts: Object.freeze(item.consumedProducts ? [...item.consumedProducts] : []),
      });
    })
  );
}

/**
 * Calculate total staff commissions from a checked-out service cart.
 * 
 * @param {ServiceCartItem[]} items
 * @returns {Array<{ staffId: string, staffName: string, commissionAmount: number }>}
 */
export function calculateStaffCommissions(items) {
  const commissions = new Map();

  for (const item of items) {
    if (item.itemType === 'SERVICE' && item.assignedStaffId && item.commissionRate > 0) {
      const lineSubtotal = item.price * item.quantity;
      const commission = Math.round(lineSubtotal * item.commissionRate);
      const staffId = item.assignedStaffId;
      const staffName = item.assignedStaffName || staffId;

      const current = commissions.get(staffId) || { staffId, staffName, commissionAmount: 0 };
      current.commissionAmount += commission;
      commissions.set(staffId, current);
    }
  }

  return [...commissions.values()];
}
