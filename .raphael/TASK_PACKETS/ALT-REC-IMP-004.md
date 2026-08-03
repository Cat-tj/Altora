# TASK PACKET — ALT-REC-IMP-004

TASK ID: ALT-REC-IMP-004
TITLE: POS enrichment — product variants, member payment, split payment

OBJECTIVE:
Port the core ShadyERP POS transaction behaviors into Altora's existing market POS:
product variant selection (groups/options with price deltas), member-linked payment
(DEPOSIT + points earn), and split payment (multiple methods per sale). Preserve
Altora's idempotent checkout core, stock ledger, and @altora design system.

CURRENT BEHAVIOR (verified):
- createMarketSale(items[{productId, quantity}], paymentMethod single, amountPaid)
- POS screen: cart, search, single CASH/QRIS/TRANSFER/EWALLET method, no variants/member
- PaymentMethod enum already has CASH/QRIS/TRANSFER/EWALLET/DEPOSIT/GIFT_CARD ✓
- Member table has depositBalance + points ✓; PointTransaction table exists ✓
- NO variant tables, NO SalePayment table, Sale has no memberId, SaleItem no variant snapshot

REQUIRED CHANGES:

1. Migration apps/market/db/migrations/0009_pos_variants_and_split_payment.sql (ADDITIVE only, disposable-DB testing):
   - ProductVariantGroup: id, tenantId, productId, name, type ('SINGLE'|'MULTIPLE'), required bool, sortOrder
   - ProductVariantOption: id, tenantId, variantGroupId, name, priceDelta int, sortOrder
   - SalePayment: id, tenantId, saleId, method, amount
   - Sale ADD COLUMN memberId text REFERENCES Member(id)
   - SaleItem ADD COLUMN variantLabel text (snapshot) + variantPriceDelta int DEFAULT 0
   - All IF NOT EXISTS / guarded, idempotent

2. Backend market-pos.ts (extend, keep idempotency + stock lock + ledger):
   - listMarketPosProducts: include variantGroups + options (grouped, sorted)
   - createMarketSale input: items[{productId, quantity, variantOptionIds?: string[]}], payments?: {method, amount}[] (fallback to single method+amountPaid), memberId?
   - Sale line price = product.price + SUM(option priceDelta); subtotal reflects it
   - Split payment: sum(payments) must equal total; insert SalePayment rows; single-payment path sets paymentMethod/amountPaid as today
   - Member: if memberId → deposit payment deducts depositBalance (transactional, insufficient → error), points earned = floor(total/1000)
   - Keep: MarketCheckoutRequest idempotency, advisory lock, rollback, stock movement via applyStockMovement with SALE source

3. UI (Altora design system, client components):
   - VariantPickerModal: shows groups (SINGLE required → must pick 1; MULTIPLE → toggle), price delta shown, returns chosen option ids + label
   - MemberPicker: search by name/phone, shows deposit balance + points, selects memberId
   - PaymentSheet: method tabs + amount inputs for split; DEPOSIT shows member balance; validates sum == total
   - pos-screen.tsx: wire variant picker on product click (when variants exist), member picker, payment sheet, cart line shows variant label

CONSTRAINTS:
- Additive migration only; no changes to existing tables' columns' types
- No change to auth/tenant/permission model
- Keep idempotent checkout (MarketCheckoutRequest) and stock ledger invariant
- No new npm dependencies
- Tests against disposable local Postgres (migrate 0001-0009 + seed + integration)
- Product without variants behaves exactly as today (backward compatible)

RELEVANT FILES:
- apps/market/db/migrations/0009_*.sql (new)
- apps/market/lib/market-pos.ts (extend)
- apps/market/app/(protected)/kasir/pos-screen.tsx + new modals under kasir/
- apps/market/lib/market-pos.integration.test.mjs (extend)
- Reference: /tmp/shadyref/src/components/kasir/{variant-picker-modal,member-picker,payment-sheet,pos-screen}.tsx + prisma/schema.prisma (ProductVariantGroup/SalePayment models)

ALLOWED FILES: apps/market/db/migrations/0009_*, apps/market/lib/market-pos.ts, apps/market/lib/market-pos.integration.test.mjs, apps/market/app/(protected)/kasir/** (new modals), .raphael/**
FORBIDDEN FILES: other migrations, auth, resto/admin/landing, packages/core schema changes, production config

BUSINESS INVARIANTS:
- total = subtotal - discount + tax; sum(payments) == total for split
- Stock ledger invariant preserved (qty == SUM(delta))
- Deposit deduction only on successful sale (transactional)
- Idempotency: retry with same requestId returns same sale, no double deduction

REQUIRED TESTS (disposable Postgres):
1. Integration: create sale with 1 variant product (price = base + delta) → SaleItem price correct, stock ledger correct
2. Integration: split payment CASH+QRIS sums to total → SalePayment rows exist
3. Integration: DEPOSIT payment deducts member balance; insufficient balance → error + rollback
4. Integration: member points earned
5. Integration: idempotent retry → same sale, member balance deducted once
6. Unit/typecheck/lint clean

ACCEPTANCE CRITERIA:
1. Migration 0009 applies clean on fresh DB (0001-0009)
2. All integration tests pass (old + new)
3. POS UI supports variants + member + split (typecheck + lint)
4. Backward compatible: plain product checkout unchanged
5. ChatGPT Web review PASS

ROLLBACK: revert commit; migration additive, no production DB touched.
STOP CONDITIONS: insufficient-balance race in DEPOSIT → use FOR UPDATE row lock on Member (note it); scope creep beyond variants/member/split → STOP.

RECOMMENDED IMPLEMENTER: Antigravity codegen for UI + Raphael for migration/backend core, or Raphael full (deterministic). Decide at execution.
