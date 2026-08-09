# TASK PACKET — ALT-REC-IMP-003

TASK ID: ALT-REC-IMP-003
TITLE: Fix stock ledger opening-balance invariant in seed (make integration test green)

OBJECTIVE:
Seed data currently writes ProductStock rows WITHOUT StockLedger entries. The ledger accounting invariant — every ProductStock.qty must be explained by SUM(StockLedger.delta) for that product+outlet — is violated, and the integration test `lib/market-stock-ledger.integration.test.mjs` FAILS (verified on disposable Postgres 16 + fresh migration + seed).

CURRENT BEHAVIOR (verified):
1. `apps/market/scripts/seed-market.mjs` line ~123: INSERT INTO ProductStock (id, tenantId, productId, outletId, qty) — no StockLedger row.
2. Integration test "jumlah ledger sama dengan saldo tersimpan" queries HAVING ps.qty <> COALESCE(SUM(l.delta),0) → returns all 10 seeded products (qty 3..200, ledger 0). FAIL.
3. StockLedgerSource enum (migration 0002) includes 'OPENING' — "saldo awal saat ledger mulai dipakai" — designed exactly for this, currently unused.

REQUIRED CHANGE (minimal, seed-only):
In seed-market.mjs, for each ProductStock insert, ALSO insert one StockLedger row:
- id: new uuid
- tenantId, outletId, productId: same as the ProductStock row
- delta: qty (positive opening)
- balanceAfter: qty
- source: 'OPENING'
- sourceId: the ProductStock id
- actorId: null (system seed)
- note: 'Saldo awal (seed)' or similar
- idempotencyKey: `seed-opening:${productStockId}` — so re-running seed (ON CONFLICT DO UPDATE) does not duplicate ledger rows
- createdAt: default NOW()
Use the SAME transaction/client as the ProductStock insert. Verify the idempotencyKey pattern matches how other seed inserts stay idempotent.

CONSTRAINTS:
- Do NOT weaken the integration test (it asserts the correct accounting invariant).
- Do NOT touch production migration files, app code, or ledger logic (applyStockMovement is already correct and covered by other tests in the same file).
- No new npm dependencies.
- Seed must remain idempotent (run twice = same ledger state).

RELEVANT FILES:
- apps/market/scripts/seed-market.mjs (edit)
- apps/market/lib/market-stock-ledger.integration.test.mjs (read-only reference — MUST pass after fix)
- apps/market/db/migrations/0002_stock_ledger_and_receiving.sql (read-only reference: enum values, ledger schema)

ALLOWED FILES: apps/market/scripts/seed-market.mjs ONLY (plus .raphael ledger/report)
FORBIDDEN FILES: db/migrations/**, apps/market/lib/**, apps/market/app/**, production config, resto/admin/landing

BUSINESS INVARIANTS:
- Every stock balance must be explainable by the ledger (accounting traceability).
- Seed must not mutate on re-run beyond idempotent upsert.
- applyStockMovement logic untouched — it already maintains balanceAfter correctly.

REQUIRED TESTS:
1. Fresh disposable DB → migrate → seed → `npm run test:integration` → ALL PASS (including "jumlah ledger sama dengan saldo tersimpan").
2. Seed twice → integration test still passes (idempotency, no duplicate ledger rows).
3. `npm test` (unit) still 25 tests, 0 new failures.

ACCEPTANCE CRITERIA:
1. seed writes OPENING ledger entries for every seeded stock row.
2. Integration test green on disposable DB (the exact failing assertion now passes).
3. Idempotent re-seed verified (no ledger duplicates).
4. No production migration, no app code change, no test weakening.
5. ChatGPT Web review PASS.

ROLLBACK: revert commit; seed-only change, no production impact.

STOP CONDITIONS: none expected (small deterministic fix). If integration test reveals additional pre-existing defects beyond seed, note them and STOP for scope decision.

RECOMMENDED IMPLEMENTER: Raphael (orchestrator) — small verified edit, no external agent needed (standing auth allows orchestrator low-risk edits).
