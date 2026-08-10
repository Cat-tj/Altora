# TASK PACKET — ALT-REC-IMP-006

TASK ID: ALT-REC-IMP-006
TITLE: Supplier & goods receiving maturity

OBJECTIVE:
Audit + harden supplier management and goods receiving (penerimaan barang).
Receiving already writes RECEIPT ledger rows (verified IMP-005). This slice
completes the surrounding workflow: supplier lifecycle, receipt draft →
complete → cancel, defect handling, and UI wiring.

CURRENT BEHAVIOR (verify first):
- lib/market-receiving.ts: listSuppliers, createReceipt (DRAFT), completeReceipt
  (RECEIPT ledger), cancelReceipt. Need to check cancel behavior (does cancel
  of a DRAFT write anything? what about cancel AFTER complete?)
- ReceivingItem has qtyAccepted + qtyDefect? (check schema)
- UI: app/(protected)/penerimaan/ — how much is wired? suppliers CRUD UI?

REQUIRED:
1. Audit cancelReceipt: DRAFT cancel = no ledger; COMPLETED cancel must NOT
   silently un-write stock (either forbid or require reversing movement with
   proper ledger entry RECEIPT_REVERSED — prefer forbid if not designed)
2. Supplier lifecycle: create/update/deactivate + validation (name required,
   unique-ish phone). Check existing actions/UI.
3. Receiving defects: qtyDefect flow — defect items should NOT enter stock
   (verify createReceipt only applies qtyAccepted to ledger)
4. Integration tests: create DRAFT → complete → stock +accepted; cancel DRAFT
   → no stock change; complete twice → error; defect qty excluded from stock
5. Unit/lint/tsc/build clean; ChatGPT Web review PASS

CONSTRAINTS:
- Additive only; no destructive migration
- No production DB; disposable Postgres only
- No auth/tenant/permission changes
- Keep idempotency patterns

ALLOWED FILES: apps/market/lib/market-receiving.ts, apps/market/app/(protected)/penerimaan/**,
apps/market/lib/*.integration.test.mjs, .raphael/**

ACCEPTANCE: receiving lifecycle fully audited + tested; defects never inflate
stock; cancel semantics safe; integration green.
