# ALTORA DEPENDENCY & ARCHITECTURE ENFORCEMENT RULES

## 1. Hierarchy & Layering Rules

Altora enforces strict layer direction. Dependencies may only flow **downward** from applications to capability packages, and from vertical adapters to shared core packages.

```
       [ apps/market ]   [ apps/resto ]   [ apps/service ]   [ apps/admin ]
              \                |                /                 /
               \               |               /                 /
                v              v              v                 v
           [@altora/market-pos]  [@altora/resto-pos]  [@altora/service-pos]
                    \                  |                  /
                     \                 |                 /
                      v                v                v
          +-----------------------------------------------------------+
          |                    SHARED CAPABILITIES                    |
          |  @altora/pos-core       @altora/pos-ui                   |
          |  @altora/inventory-core @altora/inventory-ui              |
          |  @altora/payment-core   @altora/customer-core             |
          |  @altora/promo-core     @altora/reporting-core            |
          +-----------------------------------------------------------+
                                       |
                                       v
          +-----------------------------------------------------------+
          |                   PLATFORM FOUNDATION                     |
          |  @altora/control-plane-core   @altora/ui                  |
          |  @altora/db                   @altora/permissions-core    |
          +-----------------------------------------------------------+
```

---

## 2. Forbidden Dependency Directions

1. **NO Cross-App Imports**: An application in `apps/` MUST NOT import from any other application in `apps/`.
   * ❌ `import { formatRupiah } from '../../market/lib/format'` inside `apps/resto` is **FORBIDDEN**.
   * ✅ `import { formatRupiah } from '@altora/ui'` is **ALLOWED**.

2. **NO Generic-to-Vertical Imports**: Shared packages (`packages/pos-core`, `packages/inventory-core`, `@altora/ui`) MUST NOT import from vertical apps or vertical adapters.
   * ❌ `import { MarketSale } from '@altora/market-pos'` inside `packages/pos-core` is **FORBIDDEN**.
   * ✅ Vertical packages import from generic packages (`@altora/market-pos` imports `@altora/pos-core`).

3. **NO Direct SQL in Shared Core**: Shared domain logic in `@altora/*-core` packages must NOT contain direct product-specific raw SQL queries or hardcoded table joins. Database persistence MUST be handled through persistence adapters or repository interfaces.

4. **NO Product Assumptions in POS Core**: `@altora/pos-core` must NOT contain barcode-specific business semantics, table layout rules, or appointment duration logic.

---

## 3. Architecture Boundary Checks (`scripts/check-boundaries.mjs`)

Boundary rules are enforced automatically in CI via `npm run check:boundaries`.
The script verifies:
- Zero imports matching `apps/*/` inside another `apps/*/` directory.
- Zero imports matching `packages/*/` importing from `apps/*/`.
- Zero circular imports between packages.
- Compliance with `@altora/` workspace scopes.

---

## 4. New Package Creation Gate

Before adding a new package to `packages/`, the author must verify:
1. Clear domain ownership (e.g. `@altora/service-pos`).
2. Explicit contract exported in `src/index.ts`.
3. Unit test suite in `src/*.test.ts`.
4. At least one migrated consumer application.
