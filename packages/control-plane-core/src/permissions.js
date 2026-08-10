/**
 * Altora Control Plane Role & Permission Engine
 */

export const ALTORA_PERMISSIONS = Object.freeze({
  // POS & Sales
  POS_OPEN_SHIFT: 'pos:open_shift',
  POS_CLOSE_SHIFT: 'pos:close_shift',
  POS_CREATE_SALE: 'pos:create_sale',
  POS_VOID_SALE: 'pos:void_sale',
  POS_REFUND_SALE: 'pos:refund_sale',

  // Inventory
  INVENTORY_VIEW: 'inventory:view',
  INVENTORY_ADJUST: 'inventory:adjust',
  INVENTORY_RECEIVE: 'inventory:receive',
  INVENTORY_TRANSFER: 'inventory:transfer',
  INVENTORY_OPNAME: 'inventory:opname',

  // Finance & Reports
  REPORTS_VIEW: 'reports:view',
  FINANCE_VIEW: 'finance:view',
  EXPENSE_MANAGE: 'expense:manage',

  // Tenant Settings & Users
  SETTINGS_EDIT: 'settings:edit',
  USER_MANAGE: 'user:manage',
});

const DEFAULT_ROLE_PERMISSIONS = Object.freeze({
  OWNER: Object.values(ALTORA_PERMISSIONS),
  MANAGER: [
    ALTORA_PERMISSIONS.POS_OPEN_SHIFT,
    ALTORA_PERMISSIONS.POS_CLOSE_SHIFT,
    ALTORA_PERMISSIONS.POS_CREATE_SALE,
    ALTORA_PERMISSIONS.POS_VOID_SALE,
    ALTORA_PERMISSIONS.INVENTORY_VIEW,
    ALTORA_PERMISSIONS.INVENTORY_ADJUST,
    ALTORA_PERMISSIONS.INVENTORY_RECEIVE,
    ALTORA_PERMISSIONS.INVENTORY_TRANSFER,
    ALTORA_PERMISSIONS.INVENTORY_OPNAME,
    ALTORA_PERMISSIONS.REPORTS_VIEW,
    ALTORA_PERMISSIONS.FINANCE_VIEW,
    ALTORA_PERMISSIONS.EXPENSE_MANAGE,
  ],
  STAFF: [
    ALTORA_PERMISSIONS.POS_OPEN_SHIFT,
    ALTORA_PERMISSIONS.POS_CLOSE_SHIFT,
    ALTORA_PERMISSIONS.POS_CREATE_SALE,
    ALTORA_PERMISSIONS.INVENTORY_VIEW,
  ],
});

/**
 * Check if a role or TenantContext is authorized for a specific permission.
 * 
 * @param {import('./tenant-context.js').TenantRole | { role: string, permissions?: readonly string[] }} roleOrContext
 * @param {string} permission
 * @returns {boolean}
 */
export function hasPermission(roleOrContext, permission) {
  if (!roleOrContext || !permission) return false;

  if (typeof roleOrContext === 'object') {
    if (roleOrContext.role === 'OWNER') return true;
    if (roleOrContext.permissions && roleOrContext.permissions.includes(permission)) {
      return true;
    }
    const rolePerms = DEFAULT_ROLE_PERMISSIONS[roleOrContext.role] || [];
    return rolePerms.includes(permission);
  }

  const rolePerms = DEFAULT_ROLE_PERMISSIONS[roleOrContext] || [];
  return rolePerms.includes(permission);
}
