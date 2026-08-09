# TASK PACKET — ALT-REC-IMP-005

TASK ID: ALT-REC-IMP-005
TITLE: Stock operations maturity — opname reconciliation & stock transfer integrity

OBJECTIVE:
Audit + harden the stock operations (opname/count, transfer, receiving) so every
movement writes to StockLedger with the correct invariant (ProductStock.qty ==
SUM(StockLedger.delta)) and negative stock is impossible for tracked products.

CURRENT BEHAVIOR (verify first):
- lib exists: market-stock-count.ts (opname), market-stock-transfer.ts, market-receiving.ts
- StockLedger invariant verified for SALE + seed OPENING (IMP-003/004)
- Negative stock rules: applyStockMovement throws InsufficientStockError (need to confirm all callers handle)

REQUIRED:
1. Audit each stock-mutation lib: does EVERY delta write StockLedger with
   idempotencyKey + balanceAfter? Any path that mutates ProductStock directly?
   (grep for UPDATE "ProductStock")
2. Fix any bypass found (e.g. receiving/transfer/opname adjust writing qty without ledger row)
3. Integration tests for: receiving (stock +delta, ledger row, source RECEIVING),
   transfer (outlet A -delta, outlet B +delta, ledger rows both, source TRANSFER_OUT/TRANSFER_IN),
   opname adjust (delta = counted - current, ledger row, source OPNAME_ADJUST),
   negative stock attempt → error + rollback
4. Unit/lint/tsc/build clean; ChatGPT Web review PASS

CONSTRAINTS:
- Additive only; no destructive migration
- Keep idempotency (retry same operation → same ledger row, ON CONFLICT idempotencyKey)
- No production DB; disposable Postgres only
- No auth/tenant/permission changes

ALLOWED FILES: apps/market/lib/market-stock-*.ts, apps/market/lib/market-receiving.ts,
apps/market/lib/*.integration.test.mjs (new), apps/market/db/migrations/0010_*.sql (only if
required, additive), .raphael/**

ACCEPTANCE: every ProductStock row satisfies qty == SUM(delta) after any op;
negative stock impossible; all integration green.
