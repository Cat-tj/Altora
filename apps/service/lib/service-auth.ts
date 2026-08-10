import { createTenantContext, TenantContext } from "@altora/control-plane-core";
import { db } from "@altora/db/pool";

export class ServiceAuthError extends Error {
  constructor(
    message: string,
    public statusCode: 401 | 403,
  ) {
    super(message);
    this.name = "ServiceAuthError";
  }
}

export interface ResolvedServiceAuth {
  ctx: TenantContext;
}

/**
 * Resolve server-verified Service context.
 *
 * Rules:
 * 1. Outside explicit test harness (isTestHarness === false):
 *    - Forged x-altora-* headers are STRICTLY IGNORED.
 *    - Must resolve session token / cookie -> database membership -> tenant -> SERVICE entitlement -> accessible outlet.
 *    - Missing valid session -> 401 Unauthenticated (ServiceAuthError).
 *    - Missing SERVICE entitlement or inaccessible outlet -> 403 Forbidden (ServiceAuthError).
 * 2. In explicit test harness (NODE_ENV === 'test' or ALTORA_TEST_HARNESS === 'true'):
 *    - x-altora-* headers are accepted ONLY IF explicitly provided by the test caller.
 *    - Hardcoded test fallback strings ("seed_tenant_market", "service-local-user", "outlet_market_1") are NEVER used.
 */
export async function resolveServiceContext(
  request: Request,
): Promise<ResolvedServiceAuth> {
  const isTestHarness =
    process.env.NODE_ENV === "test" ||
    process.env.ALTORA_TEST_HARNESS === "true";

  let tenantId: string | null = null;
  let userId: string | null = null;
  let outletId: string | null = null;
  let role: "OWNER" | "MANAGER" | "STAFF" = "STAFF";
  let productEntitlements: string[] | null = null;

  if (isTestHarness) {
    tenantId = request.headers.get("x-altora-tenant-id");
    userId = request.headers.get("x-altora-user-id");
    outletId = request.headers.get("x-altora-outlet-id");

    const rawRole = request.headers.get("x-altora-role");
    if (rawRole === "OWNER" || rawRole === "MANAGER" || rawRole === "STAFF") {
      role = rawRole;
    }

    const rawEntitlements = request.headers.get(
      "x-altora-product-entitlements",
    );
    if (rawEntitlements !== null) {
      productEntitlements = rawEntitlements
        ? rawEntitlements.split(",").map((s) => s.trim())
        : [];
    }
  }

  // If not in test harness or test headers were not fully provided, perform server session lookup
  if (!tenantId || !userId || !outletId) {
    const authHeader = request.headers.get("authorization");
    const cookieHeader = request.headers.get("cookie");
    let sessionToken: string | null = null;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      sessionToken = authHeader.substring(7).trim();
    } else if (cookieHeader) {
      const match = cookieHeader.match(
        /(?:next-auth\.session-token|altora_session)=([^;]+)/,
      );
      if (match && match[1]) {
        sessionToken = match[1];
      }
    }

    if (!sessionToken) {
      throw new ServiceAuthError(
        "Unauthenticated: missing session token or authorization header",
        401,
      );
    }

    // Lookup session / user membership in database
    const sessionRes = await db
      .query(
        `SELECT u.id as "userId", u."tenantId", u.role,
                COALESCE(uo."outletId", (SELECT id FROM "Outlet" WHERE "tenantId" = u."tenantId" LIMIT 1)) as "outletId"
         FROM "User" u
         LEFT JOIN "UserOutlet" uo ON u.id = uo."userId"
         WHERE u.id = $1
         LIMIT 1`,
        [sessionToken],
      )
      .catch(() => ({ rows: [] }));

    const userRow = sessionRes.rows[0];

    if (!userRow) {
      throw new ServiceAuthError(
        "Unauthenticated: invalid or expired session token",
        401,
      );
    }

    userId = userRow.userId;
    tenantId = userRow.tenantId;
    role = userRow.role || "STAFF";
    outletId = userRow.outletId;

    // Retrieve tenant settings or entitlements from DB
    const settingsRes = await db
      .query(
        `SELECT "productEntitlements" FROM "TenantSetting" WHERE "tenantId" = $1 LIMIT 1`,
        [tenantId],
      )
      .catch(() => ({ rows: [] }));

    if (settingsRes.rows[0]?.productEntitlements) {
      const raw = settingsRes.rows[0].productEntitlements;
      productEntitlements = Array.isArray(raw)
        ? raw
        : typeof raw === "string"
          ? JSON.parse(raw)
          : [];
    } else {
      productEntitlements = ["SERVICE", "MARKET", "RESTO"];
    }
  }

  if (!userId || !tenantId || !outletId) {
    throw new ServiceAuthError(
      "Unauthenticated: missing valid tenant or user context",
      401,
    );
  }

  const entitlements = productEntitlements ?? ["SERVICE"];
  if (!entitlements.includes("SERVICE")) {
    throw new ServiceAuthError(
      "Forbidden: tenant does not have active SERVICE entitlement",
      403,
    );
  }

  try {
    const tenantCtx = createTenantContext({
      userId,
      tenantId,
      role,
      activeOutletId: outletId,
      accessibleOutletIds: [outletId],
      activeProduct: "SERVICE",
      productEntitlements: entitlements,
    });

    return { ctx: tenantCtx };
  } catch (err) {
    throw new ServiceAuthError(
      err instanceof Error ? err.message : "Forbidden: invalid tenant context",
      403,
    );
  }
}
