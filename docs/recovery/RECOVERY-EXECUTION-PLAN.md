Workflow Status: AWAITING_APPROVAL
Audit Verdict: REVISE
Implementation Approval: DENIED

# RECOVERY EXECUTION PLAN — ALTORA SUITE

## 1. Overview & Baseline Identifiers

* **Source of Truth Repository:** `https://github.com/Cat-tj/ShadyERP`
* **Source Immutable SHA:** `5fb0dfb5db923235194f7e19922eba45e023239e`
* **Target Repository:** `https://github.com/Cat-tj/Altora`
* **Target Immutable SHA:** `415efc4b4cc6ac8532f0e29608d8bec04e1fed42`

This document defines the step-by-step recovery plan to bring `Altora` (`apps/market`, `apps/resto`, `apps/admin`, `apps/landing`) to **100% functional, transactional, and database parity with `ShadyERP@master`**.

Per the Master Prompt, we will **Copy, Do Not Rebuild**. We will restore full business logic, rich manager components, server actions, and database models from `ShadyERP`, while preserving the `@altora/ui` design system wrapper.

---

## 2. Execution Phases & Commit Plan

### Phase 1 — Database & Migration Infrastructure (Commit 1)
* **Goal:** Eliminate custom `split(";")` migration script failures and establish full Schema Parity with `ShadyERP`'s `schema.prisma`.
* **Actions:**
  1. Replace raw `split(";")` runner in `apps/market/scripts/ensure-market-schema.mjs` and `apps/resto/scripts/ensure-resto-schema.mjs` with strict single-statement / psql transaction execution.
  2. Create comprehensive baseline migration covering all missing tables from `ShadyERP`: `Supplier`, `PurchaseOrder`, `StockReceipt`, `StockBatch`, `ProductSerial`, `ProductRecipeItem`, `WipLedger`, `TableOrder`, `ModifierGroup`, `GiftCard`, `Attendance`, `AuditLog`, `SuperAdmin`.
* **Verification:** `npm run check-types` and live migration execution test against Supabase DB with exit code `0` on failure.

### Phase 2 — Core POS, Retur, & Shift Restoration (Commit 2)
* **Goal:** Port rich POS screen, shift open/close, variant selection, payment sheet, and itemized Retur/Void actions.
* **Actions:**
  1. Copy `pos-screen.tsx`, `payment-sheet.tsx`, `variant-picker-modal.tsx`, `cash-out-modal.tsx`, `open-shift-form.tsx`, `close-shift-form.tsx` from `ShadyERP/src/components/kasir/` to `@altora/market` & `@altora/resto`.
  2. Copy `riwayat-list.tsx` and server actions (`voidSaleAction`, `processReturnAction`, `correctSalePaymentMethodAction`).
  3. Wire up thermal receipt printing (Browser & RawBT protocol).
* **Verification:** Test POS checkout flow, variant selection, split payment, void with reason, item return with stock refund calculation.

### Phase 3 — Product, BOM Resep, & Stock Management Restoration (Commit 3)
* **Goal:** Restore full Product Manager, Recipe/BOM editor, Stock Opname, Stock Transfer, and Barcode Label generator.
* **Actions:**
  1. Copy `produk-manager.tsx`, `recipe-editor.tsx`, `variant-groups-editor.tsx`, `wholesale-tier-editor.tsx`, `label-barcode-manager.tsx` from `ShadyERP/src/components/produk/`.
  2. Copy `stock-count-manager.tsx`, `stock-receipt-manager.tsx`, `transfer-stok-manager.tsx`, `supplier-manager.tsx`, `purchase-order-manager.tsx`.
  3. Wire up atomic stock movement ledger actions.
* **Verification:** Verify physical vs system count variance calculation, PO state transitions, stock transfer multi-step approvals.

### Phase 4 — Member, RFID Card, & Promo BOGO Restoration (Commit 4)
* **Goal:** Restore Member management, RFID card assignment, deposit balance, and BOGO/Discount rules.
* **Actions:**
  1. Copy `register-member-form.tsx`, `edit-member-form.tsx`, `assign-card-form.tsx`, `member-profile.tsx` from `ShadyERP/src/components/member-portal/`.
  2. Copy `promo-manager.tsx` & `simple-promo-manager.tsx` supporting BOGO (Buy X Get Y), tier discounts, and qualifying product mappings.
  3. Copy `voucher-manager.tsx` for GiftCard creation & balance redemption.
* **Verification:** Verify BOGO promo discount application during checkout, RFID card scanning, deposit top-up.

### Phase 5 — Resto Vertical (KDS & Canvas Meja) Restoration (Commit 5)
* **Goal:** Port Resto Kitchen Display System (KDS), interactive table canvas layout editor, and QR customer menu ordering.
* **Actions:**
  1. Copy `kitchen-display.tsx`, `meja-manager.tsx`, `pesanan-masuk-manager.tsx`, `order-menu.tsx` to `@altora/resto`.
  2. Wire up live order state updates (PENDING → COOKING → READY → SERVED).
  3. Restore table position X,Y drag-canvas and QR token generator.
* **Verification:** Test table creation, QR ordering flow, live KDS status progression.

### Phase 6 — Settings, Finance, & SuperAdmin Restoration (Commit 6)
* **Goal:** Restore complete business settings, expense manager, COA profit & loss, and SuperAdmin tenant management.
* **Actions:**
  1. Copy `bisnis-form.tsx`, `karyawan-manager.tsx`, `user-form-modal.tsx`, `outlet-manager.tsx`, `modul-manager.tsx` to `/pengaturan`.
  2. Copy `pengeluaran-manager.tsx`, `profit-loss-summary.tsx`, `period-lock-manager.tsx` to `/finance`.
  3. Copy `superadmin/` managers for tenant suspension, plan updates, and subscription approvals.
* **Verification:** Test staff PIN modal assignment, tax & receipt footer update, SuperAdmin audit log viewing.

---

## 3. Mandatory Quality Gate Checklist

For each commit in the execution plan, the following automated commands must pass:
```bash
npm run check-types
npm run lint
npm test
npm run build
```

---

## 4. Verdict & Request for Approval

**VERDICT:** `REVISE`
**WORKFLOW STATUS:** `AWAITING_APPROVAL`
**IMPLEMENTATION APPROVAL:** `DENIED`

All 5 clean recovery audit documents have been written:
1. [`ALTORA-RECOVERY-AUDIT.md`](file:///Users/icat/Altora/docs/recovery/ALTORA-RECOVERY-AUDIT.md)
2. [`FEATURE-PARITY-MATRIX.md`](file:///Users/icat/Altora/docs/recovery/FEATURE-PARITY-MATRIX.md)
3. [`AUTHORIZATION-MATRIX.md`](file:///Users/icat/Altora/docs/recovery/AUTHORIZATION-MATRIX.md)
4. [`SALVAGE-MATRIX.md`](file:///Users/icat/Altora/docs/recovery/SALVAGE-MATRIX.md)
5. [`RECOVERY-EXECUTION-PLAN.md`](file:///Users/icat/Altora/docs/recovery/RECOVERY-EXECUTION-PLAN.md)

Implementation is strictly paused at the approval gate. No code changes, baseline replacement, migrations, or deployments will occur without your explicit approval.
