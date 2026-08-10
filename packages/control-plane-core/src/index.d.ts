export type AltoraProduct = 'MARKET' | 'RESTO' | 'SERVICE' | 'ADMIN';
export type TenantRole = 'OWNER' | 'MANAGER' | 'STAFF';

export interface TenantContextInput {
  userId: string;
  tenantId: string;
  role: TenantRole;
  accessibleOutletIds: string[];
  activeOutletId: string;
  activeProduct: AltoraProduct;
  productEntitlements?: string[];
  permissions?: string[];
}

export interface TenantContext {
  readonly userId: string;
  readonly tenantId: string;
  readonly role: TenantRole;
  readonly accessibleOutletIds: readonly string[];
  readonly activeOutletId: string;
  readonly activeProduct: AltoraProduct;
  readonly productEntitlements: readonly string[];
  readonly permissions: readonly string[];
  readonly isOwner: boolean;
}

export function createTenantContext(input: TenantContextInput): TenantContext;

export const ALTORA_PERMISSIONS: {
  POS_CREATE_SALE: string;
  POS_VOID_SALE: string;
  POS_APPLY_DISCOUNT: string;
  INVENTORY_VIEW: string;
  INVENTORY_EDIT: string;
  REPORTS_VIEW: string;
  SETTINGS_EDIT: string;
};

export function hasPermission(role: TenantRole, permission: string): boolean;
