/**
 * Altora Inventory Core Stock Ledger
 */

export const STOCK_SOURCES = Object.freeze([
  "OPENING",
  "SALE",
  "SALE_VOID",
  "RETURN",
  "RECEIPT",
  "ADJUSTMENT",
  "TRANSFER_OUT",
  "TRANSFER_IN",
  "CONSUMPTION",
  "RESERVATION",
]);

export class InsufficientStockError extends Error {
  /**
   * @param {string} itemId
   */
  constructor(itemId) {
    super(`Stok tidak mencukupi untuk item '${itemId}'.`);
    this.name = "InsufficientStockError";
    this.itemId = itemId;
  }
}

/**
 * Construct a unique, deterministic idempotency key for stock movements.
 * 
 * @param {string} source
 * @param {string} sourceId
 * @param {string} itemId
 * @returns {string}
 */
export function buildStockIdempotencyKey(source, sourceId, itemId) {
  if (!source || !sourceId || !itemId) {
    throw new Error("Idempotency key requires source, sourceId, and itemId");
  }
  return `${source.toLowerCase()}:${sourceId.trim()}:${itemId.trim()}`;
}

/**
 * Calculate expected balance after applying delta.
 * Throws InsufficientStockError if resulting balance would be negative.
 * 
 * @param {number} currentBalance
 * @param {number} delta
 * @param {string} itemId
 * @returns {number}
 */
export function calculateNextBalance(currentBalance, delta, itemId = 'item') {
  const current = Number.isFinite(currentBalance) ? currentBalance : 0;
  const change = Number.isFinite(delta) ? delta : 0;
  const next = current + change;
  if (next < 0) {
    throw new InsufficientStockError(itemId);
  }
  return next;
}
