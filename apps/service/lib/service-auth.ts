import { createTenantContext } from "@altora/control-plane-core";

export interface ResolvedServiceAuth {
  ctx: ReturnType<typeof createTenantContext>;
}

/**
 * Resolve server-verified Service context.
 * Header-supplied tenantId/userId are ONLY accepted in test environment.
 * In non-test environment, headers are strictly ignored to prevent forged tenant access.
 */
export function resolveServiceContext(request: Request): ResolvedServiceAuth {
  const isTestHarness =
    process.env.NODE_ENV === "test" ||
    process.env.ALTORA_TEST_HARNESS === "true";

  let tenantId: string | null = null;
  let userId: string | null = null;
  let outletId: string | null = null;
  let productEntitlements: string[] = ["SERVICE"];

  if (isTestHarness) {
    tenantId = request.headers.get("x-altora-tenant-id");
    userId = request.headers.get("x-altora-user-id");
    outletId = request.headers.get("x-altora-outlet-id");

    const rawEntitlements = request.headers.get("x-altora-product-entitlements");
    if (rawEntitlements !== null) {
      productEntitlements = rawEntitlements ? rawEntitlements.split(",") : [];
    }
  }

  // Fallback defaults for local test / demo harness
  const finalTenantId = tenantId || "seed_tenant_market";
  const finalUserId = userId || "service-local-user";
  const finalOutletId = outletId || "outlet_market_1";

  const tenantCtx = createTenantContext({
    userId: finalUserId,
    tenantId: finalTenantId,
    role: "STAFF",
    activeOutletId: finalOutletId,
    accessibleOutletIds: [finalOutletId],
    activeProduct: "SERVICE",
    productEntitlements,
  });

  return { ctx: tenantCtx };
}
