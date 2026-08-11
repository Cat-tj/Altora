# ALTORA PLATFORM MATURATION MIGRATION PLAN

## 1. Executive Summary

This document specifies the phased execution roadmap to transform Altora into a mature, modular SaaS ERP platform without big-bang rewrites. All refactoring operations use the **Strangler Fig pattern**.

---

## 2. Execution Phases Roadmap

```
PHASE A: Foundation & Control Plane
   ↓
PHASE B: Shared Transaction Platform (POS Core & POS UI)
   ↓
PHASE C: Inventory Platform & Causal Stock Ledger
   ↓
PHASE D: Market Reference Migration
   ↓
PHASE E: Resto F&B Vertical Refactor
   ↓
PHASE F: Altora Service Vertical (New App)
   ↓
PHASE G: Advanced Platform Capabilities (P1/P2)
```

---

## 3. Detailed Phase Breakdown

### Phase A — Foundation & Control Plane Architecture
* **Goal**: Establish Control Plane models, server-side `TenantContext`, `docs/architecture/` baseline, operational design tokens, and strict CI boundary checks.
* **Deliverables**:
  - `docs/architecture/` complete audit set.
  - `scripts/check-boundaries.mjs` enhanced with cross-app import detection.
  - `@altora/control-plane-core` package stub with `TenantContext` definition.
  - Verification of `npm run check:boundaries` and `npm run test:contracts`.

### Phase B — Shared Transaction Platform (`pos-core` & `@altora/pos-ui`)
* **Goal**: Clean up `pos-core`, create `@altora/pos-ui`, move generic cashier components out of `apps/market`.
* **Deliverables**:
  - Product-neutral `@altora/pos-core` (Cart, Money, PaymentIntent, Checkout, Refund primitives).
  - `@altora/pos-ui` package containing `PosShell`, `CatalogGrid`, `CartPanel`, `PaymentSheet`, `ScannerDialog`.
  - `@altora/payment-core` with dynamic QRIS parser/builder and cash reconciliation primitives.

### Phase C — Inventory Platform & Causal Stock Ledger
* **Goal**: Create `@altora/inventory-core` and `@altora/inventory-ui` with causal `StockMovement` logging.
* **Deliverables**:
  - Immutable movement types: `RECEIVE`, `SALE`, `TRANSFER_OUT`, `TRANSFER_IN`, `ADJUSTMENT`, `RETURN`, `CONSUMPTION`.
  - Concurrency & idempotency tests to ensure duplicate requests do not double-adjust stock.
  - Shared Receiving, Stock Opname, and Transfer lifecycle workflows (`DRAFT` → `APPROVED` → `SHIPPED` → `RECEIVED`).

### Phase D — Market Reference Implementation Migration
* **Goal**: Migrate `apps/market` onto shared `@altora/*` packages as the first mature reference consumer.
* **Deliverables**:
  - Market cashier screen consuming `@altora/pos-ui` and `@altora/market-pos`.
  - Market inventory pages consuming `@altora/inventory-ui`.
  - Verification of all Market E2E and unit tests.

### Phase E — Resto F&B Vertical Refactor
* **Goal**: Refactor `apps/resto`, eliminating all direct imports from `apps/market`.
* **Deliverables**:
  - `@altora/resto-pos` adapter (tables, order types, modifiers, kitchen routing).
  - Zero imports from `apps/market` in `apps/resto`.
  - Resto POS consuming `@altora/pos-ui` with Resto vertical extension slots.

### Phase F — Altora Service Vertical (New App)
* **Goal**: Introduce `apps/service` as a thin vertical app for service/appointment businesses.
* **Deliverables**:
  - `@altora/service-pos` adapter (staff assignment, duration, commission, appointment context).
  - Ability to checkout Services + Retail Products in a single cart.
  - Inventory consumption flow for hair coloring / spa products via `@altora/inventory-core`.

### Phase G — Platform P1/P2 Capabilities & Final System Acceptance
* **Goal**: Procurement, loyalty points ledger, advanced promo engine, finance reports, notifications, and final maturity report matrix.

---

## 4. Definition of Done (DoD) per Slice

A slice is DONE only when:
1. Architecture owner is explicit.
2. Duplicate implementations removed or migration documented.
3. Static verification (`typecheck`, `lint`, `build`) passes.
4. Runtime verification confirmed on live app environment.
5. Visual verification completed across Desktop (1440x900) and Mobile (390x844).
6. Independent ChatGPT Web Critic (Project Raphael) returns `PASS`.
7. Docs & Capability Registry updated.
