export type TenantContext = {
  tenantId: string;
  userId: string;
  role: "OWNER" | "MANAGER" | "STAFF";
  activeOutletId?: string;
};

/**
 * Validate tenantId and userId exist in context.
 */
export function requireTenant(
  ctx: Partial<TenantContext>,
): asserts ctx is TenantContext {
  if (!ctx?.tenantId) throw new Error("tenantId wajib ada di context.");
  if (!ctx?.userId) throw new Error("userId wajib ada di context.");
}
