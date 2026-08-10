# ALTORA DATA OWNERSHIP & TENANT ISOLATION ARCHITECTURE

## 1. Executive Summary

This document specifies the database strategy, schema domain boundaries, and multi-tenant isolation rules for the Altora SaaS ERP Platform.

---

## 2. Core Concepts & Definitions

* **USER**: A human account identified by a unique `userId`. A single user may belong to multiple tenants (e.g. Richard owning Minimarket ABC and Kopi XYZ).
* **TENANT**: A legal business entity or operating organization identified by `tenantId`.
* **OUTLET**: A physical or logical operating location belonging to a single tenant (`outletId`).
* **PRODUCT**: An Altora vertical entitlement (`MARKET`, `RESTO`, `SERVICE`). A tenant can subscribe to multiple products.
* **TENANT CONTEXT**: A server-verified context object describing the current authenticated user's access boundaries.

```
ACCOUNT / USER  ≠  TENANT  ≠  OUTLET
```

---

## 3. Database Topology

Altora uses a dual-plane database model:

```
+-----------------------------------------------------------------------+
|                         ALTORA CONTROL PLANE DB                       |
|                                                                       |
|  User · Tenant · TenantMembership · Outlet · Product · Entitlement    |
|  Role · Permission · MembershipRole · OutletAccess · Subscription     |
+-----------------------------------------------------------------------+
                                   |
           +-----------------------+-----------------------+
           |                       |                       |
           v                       v                       v
+---------------------+ +---------------------+ +---------------------+
|  MARKET DATA PLANE  | |   RESTO DATA PLANE  | |  SERVICE DATA PLANE |
|                     | |                     | |                     |
|  Products · Catalog | |  Tables · Kitchen   | |  Services · Staff   |
|  Sales · Stock      | |  Orders · Modifiers | |  Appointments       |
|  Inventory Ledger   | |  Inventory Ledger   | |  Inventory Ledger   |
+---------------------+ +---------------------+ +---------------------+
```

*Note: In initial deployment phases, Control DB and Data Plane DBs may reside on the same physical PostgreSQL instance (e.g., as logical databases or schemas `control`, `market`, `resto`, `service`) to avoid infrastructure overhead while maintaining strict domain boundaries.*

---

## 4. Control Plane Schema

```sql
-- Control Plane Models (Owned by @altora/control-plane-core)

CREATE TABLE tenants (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE outlets (
    id VARCHAR(64) PRIMARY KEY,
    tenant_id VARCHAR(64) NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE tenant_memberships (
    id VARCHAR(64) PRIMARY KEY,
    tenant_id VARCHAR(64) NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id VARCHAR(64) NOT NULL,
    role VARCHAR(32) NOT NULL DEFAULT 'STAFF', -- OWNER, MANAGER, STAFF
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (tenant_id, user_id)
);

CREATE TABLE outlet_access (
    id VARCHAR(64) PRIMARY KEY,
    membership_id VARCHAR(64) NOT NULL REFERENCES tenant_memberships(id) ON DELETE CASCADE,
    outlet_id VARCHAR(64) NOT NULL REFERENCES outlets(id) ON DELETE CASCADE,
    UNIQUE (membership_id, outlet_id)
);

CREATE TABLE tenant_product_entitlements (
    id VARCHAR(64) PRIMARY KEY,
    tenant_id VARCHAR(64) NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    product VARCHAR(32) NOT NULL, -- MARKET, RESTO, SERVICE
    is_active BOOLEAN DEFAULT TRUE,
    expires_at TIMESTAMP WITH TIME ZONE,
    UNIQUE (tenant_id, product)
);
```

---

## 5. Server-Verified TenantContext Contract

Every operational request MUST derive its tenant and outlet boundaries from a trusted server-side context.

```typescript
export interface TenantContext {
  userId: string;
  tenantId: string;
  accessibleOutletIds: string[];
  activeOutletId: string;
  activeProduct: 'MARKET' | 'RESTO' | 'SERVICE';
  permissions: string[];
  isOwner: boolean;
}
```

### Security Gates:
1. **NEVER** trust `tenantId` or `outletId` supplied in client request bodies or URL parameters without cross-checking `accessibleOutletIds` and `tenant_memberships`.
2. All operational DB queries MUST include explicit `tenant_id = ctx.tenantId` and `outlet_id = ctx.activeOutletId` conditions.

---

## 6. Multi-Tenant Data Plane Isolation Rules

Every operational record MUST be scoped by:
1. `tenant_id` (mandatory for all tenant-owned data).
2. `outlet_id` (mandatory for all location-specific operational data such as stock balances, sales transactions, shifts, and cash registers).

### PostgreSQL Row Level Security (Defense-in-Depth)

```sql
-- RLS Policy Example for Data Plane tables
ALTER TABLE market_sales ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_policy ON market_sales
    USING (tenant_id = current_setting('app.current_tenant_id'));
```

---

## 7. Adversarial Test Cases (Mandatory Verification)

Before declaring any operational module or API complete, the following automated adversarial security tests MUST pass:

1. **Cross-Tenant Read**: Tenant A user attempting to read Tenant B's sale record via API `/api/sales/sale_B123` returns `404 Not Found` or `403 Forbidden`.
2. **Cross-Tenant Mutation**: Tenant A user attempting to void Tenant B's sale or adjust Tenant B's stock balance returns `403 Forbidden` and emits an Audit Log entry.
3. **Unauthorized Outlet Access**: Outlet Manager A (scoped to Outlet 1) attempting to access Outlet 2's cash shift returns `403 Forbidden`.
4. **Header / Parameter Tampering**: Submitting `X-Tenant-Id: tenant_B` or body `{ tenantId: "tenant_B" }` while authenticated as Tenant A user is ignored or rejected by `TenantContext`.
