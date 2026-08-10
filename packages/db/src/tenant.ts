import { db } from "./pool.js";

export type TenantContext = {
  tenantId: string;
  userId: string;
  role: "OWNER" | "MANAGER" | "STAFF";
};

/**
 * Build the production tenant predicate before a query reaches PostgreSQL.
 * The SQL must already have a WHERE clause so callers cannot accidentally
 * scope a broad UPDATE/DELETE by appending a predicate to the wrong query.
 */
export function buildTenantQuery(
  sql: string,
  params: unknown[],
  ctx: TenantContext,
): { sql: string; params: unknown[] } {
  requireTenant(ctx);
  if (!/\bwhere\b/i.test(sql)) {
    throw new Error("Tenant-scoped query wajib memiliki WHERE clause.");
  }
  if (/tenantid|tenant_id/i.test(sql)) {
    throw new Error("Jangan menyisipkan tenant predicate manual; gunakan tenantQuery.");
  }
  const nextPlaceholder = params.length + 1;
  return {
    sql: `${sql} AND "tenantId" = $${nextPlaceholder}`,
    params: [...params, ctx.tenantId],
  };
}

export async function tenantQuery<T extends Record<string, unknown>>(
  sql: string,
  params: unknown[],
  ctx: TenantContext,
): Promise<{ rows: T[] }> {
  const query = buildTenantQuery(sql, params, ctx);
  return db.query<T>(query.sql, query.params);
}

/**
 * Validate tenantId exists in the session context.
 */
export function requireTenant(
  ctx: Partial<TenantContext>,
): asserts ctx is TenantContext {
  if (!ctx.tenantId) throw new Error("tenantId wajib ada di context.");
  if (!ctx.userId) throw new Error("userId wajib ada di context.");
}
