/**
 * Altora Control Plane TenantContext
 * 
 * Server-verified boundary object defining user, tenant, outlet, product,
 * and permission entitlements.
 */

/**
 * @typedef {'MARKET' | 'RESTO' | 'SERVICE' | 'ADMIN'} AltoraProduct
 */

/**
 * @typedef {'OWNER' | 'MANAGER' | 'STAFF'} TenantRole
 */

/**
 * @typedef {Object} TenantContextInput
 * @property {string} userId
 * @property {string} tenantId
 * @property {TenantRole} role
 * @property {string[]} accessibleOutletIds
 * @property {string} activeOutletId
 * @property {AltoraProduct} activeProduct
 * @property {string[]} [productEntitlements]
 * @property {string[]} [permissions]
 */

/**
 * Construct and validate a server-derived TenantContext.
 * 
 * @param {TenantContextInput} input
 * @returns {Readonly<TenantContextInput & { isOwner: boolean }>}
 */
export function createTenantContext(input) {
  if (!input.userId) throw new Error("TenantContext requires a valid userId");
  if (!input.tenantId) throw new Error("TenantContext requires a valid tenantId");
  if (!input.activeOutletId) throw new Error("TenantContext requires a valid activeOutletId");
  if (!input.accessibleOutletIds || !Array.isArray(input.accessibleOutletIds)) {
    throw new Error("TenantContext requires an accessibleOutletIds array");
  }

  // Security Gate: Active outlet MUST be inside user's accessibleOutletIds
  if (!input.accessibleOutletIds.includes(input.activeOutletId)) {
    throw new Error(`Unauthorized outlet access: Outlet '${input.activeOutletId}' is not accessible by user '${input.userId}' in tenant '${input.tenantId}'`);
  }

  // Security Gate: Check product entitlement (FAIL CLOSED: defaults to [] if omitted)
  const entitlements = input.productEntitlements || [];
  if (input.activeProduct !== 'ADMIN' && !entitlements.includes(input.activeProduct)) {
    throw new Error(`Tenant '${input.tenantId}' does not have an active entitlement for product '${input.activeProduct}'`);
  }

  return Object.freeze({
    userId: input.userId,
    tenantId: input.tenantId,
    role: input.role || 'STAFF',
    accessibleOutletIds: Object.freeze([...input.accessibleOutletIds]),
    activeOutletId: input.activeOutletId,
    activeProduct: input.activeProduct,
    productEntitlements: Object.freeze([...entitlements]),
    permissions: Object.freeze([...(input.permissions || [])]),
    isOwner: input.role === 'OWNER',
  });
}
