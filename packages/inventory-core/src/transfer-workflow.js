/**
 * Stock Transfer Lifecycle State Machine
 */

export const TRANSFER_STATUSES = Object.freeze({
  DRAFT: "DRAFT",
  APPROVED: "APPROVED",
  SHIPPED: "SHIPPED",
  RECEIVED: "RECEIVED",
  CANCELLED: "CANCELLED",
  REJECTED: "REJECTED",
});

const ALLOWED_TRANSITIONS = Object.freeze({
  DRAFT: [TRANSFER_STATUSES.APPROVED, TRANSFER_STATUSES.CANCELLED],
  APPROVED: [TRANSFER_STATUSES.SHIPPED, TRANSFER_STATUSES.CANCELLED],
  SHIPPED: [TRANSFER_STATUSES.RECEIVED, TRANSFER_STATUSES.REJECTED],
  RECEIVED: [],
  CANCELLED: [],
  REJECTED: [],
});

/**
 * Validate state transition for stock transfer lifecycle.
 * 
 * @param {string} currentStatus
 * @param {string} targetStatus
 * @returns {boolean}
 */
export function canTransitionTransfer(currentStatus, targetStatus) {
  const allowed = ALLOWED_TRANSITIONS[currentStatus] || [];
  return allowed.includes(targetStatus);
}

/**
 * Transition a stock transfer status or throw Error if invalid.
 * 
 * @param {string} currentStatus
 * @param {string} targetStatus
 * @returns {string}
 */
export function transitionTransferStatus(currentStatus, targetStatus) {
  if (!canTransitionTransfer(currentStatus, targetStatus)) {
    throw new Error(`Invalid transfer transition from '${currentStatus}' to '${targetStatus}'`);
  }
  return targetStatus;
}
