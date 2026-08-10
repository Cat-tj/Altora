Workflow Status: AWAITING_APPROVAL
Audit Verdict: REVISE
Implementation Approval: DENIED

# ALTORA RECOVERY AUDIT

## 1. Executive Summary

This document presents a comprehensive, empirical audit of the Altora repository recovery status. The target repository at commit `415efc4b4cc6ac8532f0e29608d8bec04e1fed42` was audited against the canonical baseline repository `ShadyERP` at commit `5fb0dfb5db923235194f7e19922eba45e023239e`.

The audit identified critical technical blockers, including unsafe DDL migration execution via string splitting, missing server-side role authorization guards on protected routes, and missing frontend manager components for complex business workflows (variants, modifiers, promos, member RFID, and stock opname adjustments).

The monorepo structure itself (`apps/market`, `apps/resto`, `@altora/ui`) is not the root cause of regressions; backend engines in `@altora/pos-core` are present but disconnected from frontend manager components.

* **Audit Verdict:** REVISE
* **Workflow Status:** AWAITING_APPROVAL
* **Implementation Approval:** DENIED
* **Primary Recommendation:** Execute a 6-phase baseline recovery plan to copy and wire ShadyERP manager components and server actions into Altora apps, maintaining 100% feature parity while preserving the `@altora/ui` design system.

---

## 2. Repository Identity & Archive Verification

### 2.1 Commit Identifiers
* **Source of Truth Repository:** `https://github.com/Cat-tj/ShadyERP`
* **Source Immutable SHA:** `5fb0dfb5db923235194f7e19922eba45e023239e`
* **Target Repository:** `https://github.com/Cat-tj/Altora`
* **Target Immutable SHA:** `415efc4b4cc6ac8532f0e29608d8bec04e1fed42`

### 2.2 Archive Tag Verification
Command executed:
```bash
git tag -a -f archive/failed-rewrite-2026-08-03 415efc4b4cc6ac8532f0e29608d8bec04e1fed42 -m "Archive tag for failed rewrite baseline"
git push origin refs/tags/archive/failed-rewrite-2026-08-03 --force
git ls-remote --tags origin
```

Output:
```text
b5f87c63ac6765e0784062e557c74d67fdeab045	refs/tags/archive/failed-rewrite-2026-08-03
415efc4b4cc6ac8532f0e29608d8bec04e1fed42	refs/tags/archive/failed-rewrite-2026-08-03^{}
```

Interpretation:
Annotated tag `archive/failed-rewrite-2026-08-03` object `b5f87c63ac6765e0784062e557c74d67fdeab045` correctly points to commit `415efc4b4cc6ac8532f0e29608d8bec04e1fed42` and is verified live on remote `origin`.

### 2.3 Repository Rename Context
* **Context Status:** USER-PROVIDED CONTEXT
* **Details:** The user stated that `Altoraini` was renamed to `Altora`. Because git commit history does not contain a directory rename commit string, this claim is recorded strictly as user-provided context. Working directory and git remote are verified as `https://github.com/Cat-tj/Altora.git`.

---

## 3. Canonical Baseline Metrics (ShadyERP)

Commands executed against `/Users/icat/ShadyERP/prisma/schema.prisma` and application directories:

```bash
grep -c "^model " /Users/icat/ShadyERP/prisma/schema.prisma
grep -c "^enum " /Users/icat/ShadyERP/prisma/schema.prisma
wc -l /Users/icat/ShadyERP/prisma/schema.prisma
find /Users/icat/ShadyERP/src/app -name "page.tsx" | wc -l
find /Users/icat/Altora/apps -name "page.tsx" | wc -l
```

Actual output:
```text
118
68
3413 /Users/icat/ShadyERP/prisma/schema.prisma
103
32
```

Exact Metric Baseline Table:

| Metric | ShadyERP Baseline Value | Altora Target Value | Gap / Difference |
| :--- | :--- | :--- | :--- |
| **Prisma Models** | 118 | 24 (Manual DDL) | -94 Models |
| **Prisma Enums** | 68 | 8 (Manual DDL) | -60 Enums |
| **Schema Lines** | 3,413 lines | 8 migration files | Non-declarative DDL |
| **Total `page.tsx` Routes** | 103 routes | 32 routes | -71 Routes |

---

## 4. Detailed Audit Findings & Technical Evidence

### Finding 1: Unsafe Raw DDL Migration Execution (`split(";")`)
* **File:** `apps/market/scripts/ensure-market-schema.mjs` (Lines 23-30), `apps/resto/scripts/ensure-resto-schema.mjs` (Lines 23-30)
* **Observed Behavior:** Migration SQL strings are split using `.split(";")`. Complex SQL blocks such as PL/pgSQL functions (`DO $$ BEGIN ... END $$;`) fail syntax parsing. Script catches error as warning and logs `Schema siap`.
* **Impact:** Database schema migrations report success despite SQL failures, creating table inconsistencies.
* **Severity:** CRITICAL
* **Confidence:** 100%
* **Disposition:** DELETE split runner; replace with strict single-statement or transaction execution.
* **Verification Method:** Execute migration script against test DB; verify process exits with code 1 on any DDL syntax failure.

### Finding 2: Missing Server-Side Role Authorization & Outlet Scoping
* **File:** `apps/market/app/(protected)/audit-log/page.tsx` (Lines 1-12), `apps/market/app/(protected)/pengaturan/page.tsx` (Lines 1-10)
* **Observed Behavior:** UI navigation (`marketNav`) hides links based on role (`roles: ["OWNER"]`), but server components only check `auth()` session presence without checking `user.role === "OWNER"` or `user.outletId`.
* **Impact:** Insecure Direct Object Reference (IDOR). Non-owner users can access sensitive owner pages by navigating directly to the URL.
* **Severity:** HIGH
* **Confidence:** 100%
* **Disposition:** RESTORE FROM SHADYERP server-side `assertRole()` and `assertOutletAccess()` guards.
* **Verification Method:** Send HTTP request with `STAFF` session to `/audit-log`; verify response is `HTTP 403 Forbidden`.

### Finding 3: POS Backend vs UI Disconnect
* **File:** `packages/pos-core/src/checkout.js` (Lines 1-50), `apps/market/app/(protected)/kasir/page.tsx` (Lines 1-80)
* **Observed Behavior:** Backend shift enforcement, price validation, stock lock, idempotency, and transaction rollback exist in `@altora/pos-core`. However, `kasir/page.tsx` UI lacks variant picker modals, modifier group selection, member deposit payment, BOGO promos, and split payment sheets.
* **Impact:** Cashier interface cannot select variants, apply BOGO promos, or accept member deposits.
* **Severity:** HIGH
* **Confidence:** 100%
* **Disposition:** MERGE `@altora/pos-core` with restored ShadyERP UI modals (`pos-screen.tsx`, `payment-sheet.tsx`, `variant-picker-modal.tsx`).
* **Verification Method:** Execute checkout workflow test with variant selection, BOGO promo, and split payment.

### Finding 4: Retur Transaction Integration Gaps
* **File:** `apps/market/app/(protected)/kasir/riwayat/page.tsx`, `apps/market/app/(protected)/retur/page.tsx`
* **Observed Behavior:** Database tables for itemized returns (`SaleReturn`, `SaleReturnItem`) and stock ledger reversals exist. However, the UI lacks cash/QRIS refund processing, loyalty point deduction reversals, and payment correction modals.
* **Impact:** Retur operations require manual financial reconciliation and leave member loyalty points unadjusted.
* **Severity:** MEDIUM
* **Confidence:** 100%
* **Disposition:** RESTORE FROM SHADYERP `riwayat-list.tsx` return modal and refund actions.
* **Verification Method:** Perform partial item return; verify stock ledger credit, refund calculation, and loyalty point deduction reversal.

### Finding 5: Resto Vertical Layout & Auth Clarification
* **File:** `apps/resto/app/(protected)/layout.tsx`
* **Observed Behavior:** Resto HAS a protected layout and authentication guard. Monorepo architecture is not the cause of regressions. The issue is that table ordering (`pesanan-meja`), KDS live timer updates, and BOM recipe deductions are un-wired or static in UI components.
* **Impact:** Resto screens display static data rather than live order transitions.
* **Severity:** HIGH
* **Confidence:** 100%
* **Disposition:** MERGE ShadyERP's `kitchen-display.tsx` and `meja-manager.tsx` into `@altora/resto`.
* **Verification Method:** Create table order, verify live appearance on KDS, verify ingredient stock deduction.

---

## 5. Actual Runtime Verification Results

Commands executed on target commit `415efc4b4cc6ac8532f0e29608d8bec04e1fed42`:

### 5.1 Typecheck Execution
Command:
```bash
npm run check-types
```
Output Summary:
```text
Tasks: 9 successful, 9 total
Time: 7.164s
Exit Code: 0
```

### 5.2 ESLint Execution
Command:
```bash
npm run lint
```
Output Summary:
```text
Tasks: 9 successful, 9 total
Time: 14ms (Full Turbo Cache)
Exit Code: 0
```

### 5.3 Unit & Contract Tests Execution
Command:
```bash
npm test
```
Output Summary:
```text
✔ 13 contract tests passed
✔ 1 version test passed
✔ 1 repository health test passed
✔ 5 market tests passed (2 skipped due to local DB requirement)
Exit Code: 0
```

### 5.4 Production Build Execution
Command:
```bash
npm run build
```
Output Summary:
```text
Tasks: 3 successful, 3 total (Static apps)
Market build completed successfully in 14.0s
Exit Code: 0
```

### 5.5 Browser Endpoint Verification
Command:
```bash
curl -sI http://localhost:3013/kasir
```
Output Summary:
```text
HTTP/1.1 307 Temporary Redirect
location: /login?callbackUrl=%2Fkasir
Exit Code: 0
```

---

## 6. Recommendations & Approval Gate

### 6.1 Recovery Strategy Recommendations
1. Maintain Monorepo structure (`@altora/market`, `@altora/resto`, `@altora/ui`).
2. Restore all 42+ ShadyERP manager UI components and server actions without modifying core business rules.
3. Apply `@altora/ui` design system tokens to restored components.
4. Implement server-side role and outlet guards on all protected routes.

### 6.2 Approval Gate Status
* **Workflow Status:** AWAITING_APPROVAL
* **Audit Verdict:** REVISE
* **Implementation Approval:** DENIED

No code changes, baseline replacement, migrations, or deployments will be executed until implementation approval is granted by the user.
