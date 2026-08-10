import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createTenantContext, ALTORA_PERMISSIONS, hasPermission } from './index.js';

test('createTenantContext validates userId, tenantId, and activeOutletId', () => {
  assert.throws(() => createTenantContext({}), /userId/);
  assert.throws(() => createTenantContext({ userId: 'u1' }), /tenantId/);
});

test('createTenantContext rejects unauthorized outlet access', () => {
  assert.throws(() => {
    createTenantContext({
      userId: 'user_1',
      tenantId: 'tenant_A',
      role: 'STAFF',
      accessibleOutletIds: ['outlet_1'],
      activeOutletId: 'outlet_2',
      activeProduct: 'MARKET',
    });
  }, /Unauthorized outlet access/);
});

test('createTenantContext accepts valid context and sets isOwner correctly', () => {
  const ctx = createTenantContext({
    userId: 'user_1',
    tenantId: 'tenant_A',
    role: 'OWNER',
    accessibleOutletIds: ['outlet_1', 'outlet_2'],
    activeOutletId: 'outlet_1',
    activeProduct: 'MARKET',
  });

  assert.equal(ctx.userId, 'user_1');
  assert.equal(ctx.tenantId, 'tenant_A');
  assert.equal(ctx.activeOutletId, 'outlet_1');
  assert.equal(ctx.isOwner, true);
});

test('hasPermission validates OWNER vs MANAGER vs STAFF boundaries', () => {
  assert.equal(hasPermission('OWNER', ALTORA_PERMISSIONS.SETTINGS_EDIT), true);
  assert.equal(hasPermission('MANAGER', ALTORA_PERMISSIONS.SETTINGS_EDIT), false);
  assert.equal(hasPermission('STAFF', ALTORA_PERMISSIONS.POS_VOID_SALE), false);
  assert.equal(hasPermission('STAFF', ALTORA_PERMISSIONS.POS_CREATE_SALE), true);
});
