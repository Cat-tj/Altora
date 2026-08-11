# ALTORA ARCHITECTURE AUDIT

## 1. Executive Summary

This document represents the baseline **Phase Zero Architecture Audit** for the Altora SaaS ERP Platform.
It analyzes the current repository structure (`/Users/icat/Projects/Altora`), maps existing application capabilities, identifies architecture violations (e.g. cross-app imports and logic duplication), and establishes the target modular architecture.

---

## 2. Current Repository Topology

Altora currently operates as a Next.js monorepo (managed via `turbo` and `npm workspaces`):

```
apps/
  ├── market/     (Retail POS & ERP application — primary reference implementation)
  ├── resto/      (F&B vertical application)
  ├── admin/      (Platform Control Plane administration)
  └── landing/    (Marketing & public portal)

packages/
  ├── core/       (Shared core contracts & product catalog stub)
  ├── ui/         (@altora/ui shared UI primitives)
  ├── pos-core/   (Shared POS cart, money, & checkout core primitives)
  ├── market-pos/ (Market-specific POS adapter)
  ├── resto-pos/  (Resto-specific POS adapter)
  ├── db/         (Database schema & client definitions)
  ├── laporan/    (Reporting shared module)
  ├── notifikasi/ (Notifications & triggers)
  └── pengaturan/ (Tenant settings shared module)
```

---

## 3. Major Architecture Violations & Structural Debt

Through Knowledge Graph traversal (`codebase-memory`) and dependency analysis, the following violations were identified:

### Violation A: Direct Cross-App Imports (`apps/resto` → `apps/market`)
* **Finding**: `apps/resto` directly imports components, utilities, and server actions from `apps/market` (7 direct cross-app calls detected).
* **Impact**: Resto cannot build or deploy independently of Market code. Changes to Market UI or helper scripts risk breaking Resto.
* **Resolution**: Extract all shared UI, auth, sales, and settings utilities into `@altora/ui`, `@altora/pos-ui`, `@altora/control-plane-core`, or shared packages.

### Violation B: Duplicated Domain & POS UI Logic
* **Finding**: `apps/market` and `apps/resto` maintain separate cashier screens, cart panels, barcode scanners, and payment dialogs.
* **Impact**: Fixes applied to Market POS (e.g., QRIS validation, barcode camera cleanup, member selection) do not reflect in Resto POS.
* **Resolution**: Consolidate common POS UI components into `@altora/pos-ui` with vertical extension slots.

### Violation C: Unaudited Stock Mutations
* **Finding**: Stock is updated directly in some places by mutating balance records rather than appending causal movement logs (`StockMovement`).
* **Impact**: Lack of inventory audit trail, race conditions during concurrent sales/adjustments, and inability to reconcile stock.
* **Resolution**: Implement `@altora/inventory-core` with immutable `StockMovement` causality logs.

### Violation D: Mixed Control Plane & Data Plane Boundaries
* **Finding**: Tenant membership, outlet scoping, and user credentials are tightly coupled with Market operational schema.
* **Impact**: Difficult to isolate tenant data or support multi-product subscriptions (e.g., a single tenant owning Market + Resto + Service outlets).
* **Resolution**: Separate Control Plane schema (`User`, `Tenant`, `Outlet`, `TenantProduct`, `OutletAccess`) from Data Plane operational schemas.

---

## 4. Target Architecture Vision

```
                      ALTORA CONTROL PLANE

                 Identity / User / Tenant
                 Membership / Subscription
                 Entitlement / Outlet Access
                           |
                           |
             +-------------+-------------+
             |             |             |
             v             v             v

         MARKET          RESTO         SERVICE
       DATA PLANE      DATA PLANE     DATA PLANE

             ^             ^             ^
             |             |             |
             +------ SHARED MODULES -----+

                 POS Core & POS UI
                 Inventory Core & UI
                 Payment Core
                 Customer Core
                 Promo & Voucher Core
                 Reporting & Audit Core
                 Permissions Core
                 Finance Core
```

### Core Architecture Rules:
1. **Default = REUSE**: Before creating any file/component/service, prove equivalent capability does not exist.
2. **Apps are Consumers, Packages are Owners**: Domain logic lives in `@altora/*` packages; apps are thin configuration shells.
3. **No App-to-App Dependencies**: Apps must NEVER import from other apps.
4. **Causality & Auditability**: Stock and money transactions must be immutable and causal.
5. **Verified Engineering Loop**: Every change follows `Graphify` → `Targeted Search` → `Slice` → `Tests` → `Runtime` → `Browser Screenshots` → `ChatGPT Web Critic`.
