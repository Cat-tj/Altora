import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildStockIdempotencyKey,
  calculateNextBalance,
  InsufficientStockError,
  canTransitionTransfer,
  transitionTransferStatus,
  TRANSFER_STATUSES,
} from './index.js';

test('buildStockIdempotencyKey creates deterministic lowercase key', () => {
  const key = buildStockIdempotencyKey('SALE', 'sale_123', 'prod_456');
  assert.equal(key, 'sale:sale_123:prod_456');
});

test('calculateNextBalance updates balance correctly and throws on negative balance', () => {
  assert.equal(calculateNextBalance(100, -20, 'prod_1'), 80);
  assert.equal(calculateNextBalance(10, 5, 'prod_1'), 15);
  assert.throws(() => calculateNextBalance(5, -10, 'prod_1'), InsufficientStockError);
});

test('canTransitionTransfer enforces stock transfer lifecycle', () => {
  assert.equal(canTransitionTransfer('DRAFT', 'APPROVED'), true);
  assert.equal(canTransitionTransfer('APPROVED', 'SHIPPED'), true);
  assert.equal(canTransitionTransfer('SHIPPED', 'RECEIVED'), true);
  assert.equal(canTransitionTransfer('DRAFT', 'RECEIVED'), false);
  assert.equal(canTransitionTransfer('RECEIVED', 'DRAFT'), false);
});

test('transitionTransferStatus throws on invalid transition', () => {
  assert.throws(() => transitionTransferStatus('RECEIVED', 'DRAFT'), /Invalid transfer transition/);
});
