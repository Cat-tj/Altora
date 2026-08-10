import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalizeServiceCart, calculateStaffCommissions } from './index.js';

test('normalizeServiceCart requires assignedStaffId for SERVICE items', () => {
  assert.throws(() => {
    normalizeServiceCart([
      { id: 's1', name: 'Potong Rapi', itemType: 'SERVICE', price: 50000, quantity: 1 }
    ]);
  }, /penugasan staf/);
});

test('normalizeServiceCart accepts valid mix of SERVICE and RETAIL items', () => {
  const cart = normalizeServiceCart([
    { id: 's1', name: 'Potong Rapi', itemType: 'SERVICE', price: 50000, quantity: 1, assignedStaffId: 'staff_1', assignedStaffName: 'Budi' },
    { id: 'r1', name: 'Pomade Waterbased', itemType: 'RETAIL', price: 75000, quantity: 1 }
  ]);

  assert.equal(cart.length, 2);
  assert.equal(cart[0].itemType, 'SERVICE');
  assert.equal(cart[1].itemType, 'RETAIL');
});

test('calculateStaffCommissions calculates correct commission per staff', () => {
  const cart = [
    { id: 's1', name: 'Potong Rapi', itemType: 'SERVICE', price: 50000, quantity: 1, assignedStaffId: 'staff_1', assignedStaffName: 'Budi', commissionRate: 0.20 },
    { id: 's2', name: 'Coloring', itemType: 'SERVICE', price: 150000, quantity: 1, assignedStaffId: 'staff_1', assignedStaffName: 'Budi', commissionRate: 0.10 },
  ];

  const commissions = calculateStaffCommissions(cart);
  assert.equal(commissions.length, 1);
  assert.equal(commissions[0].staffId, 'staff_1');
  assert.equal(commissions[0].commissionAmount, 10000 + 15000); // 25,000
});
