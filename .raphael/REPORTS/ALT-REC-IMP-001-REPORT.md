# REPORT — ALT-REC-IMP-001 (Migration Runner)

Branch: orchestration/raphael-bootstrap
Base SHA: 415efc4b4cc6ac8532f0e29608d8bec04e1fed42
Implementation Commit SHA: 8982a2450dcd3dc7f9d65635138f5576ac6456dc
Task ID: ALT-REC-IMP-001 — Harden migration runner
Implementer: Antigravity (antigravity/claude-opus-4-6-thinking) — code generation
Reviewer: ChatGPT Web (chatgpt-web/gpt-5.5) — packet PASS, verification PASS

## Changed files
- apps/market/scripts/ensure-market-schema.mjs (rewritten)
- apps/resto/scripts/ensure-resto-schema.mjs (rewritten)
- apps/market/scripts/sql-splitter.mjs (NEW — shared splitter, exported)
- apps/resto/scripts/sql-splitter.mjs (NEW)
- apps/market/lib/sql-splitter.test.mjs (NEW — 12 tests)
- apps/market/db/migrations/0006_fix_production_schema_columns.sql (fix)
- apps/market/db/migrations/0007_master_supabase_schema_alignment.sql (fix)
- apps/market/db/migrations/0008_align_promo_and_attendance_columns.sql (fix)

## Commands & results (all verified, disposable Postgres 16 local)
- `npm test` (apps/market): 18 tests, 16 pass, 0 fail (2 pre-existing skipped)
- Fresh DB migration: 8 market + 1 resto migrations → EXIT 0
- Idempotency re-run: EXIT 0
- Induced failure: EXIT 1, `Error in 9999_induced_failure.sql, statement 2: syntax error at or near "THIS"`
- `node --check` all scripts: OK

## Discovered bugs fixed (real, previously silent)
Old runner swallowed errors (print ✓ regardless). New runner surfaced 10 donor-era
backfills in 0006/0007/0008 referencing columns that never exist on fresh Altora DBs:
totalRefund, processedById, startedBy, completedBy, transferredById, sentById,
physicalQty, minSpend, discountValue, clockInAt, clockOutAt.
Fix: wrapped each in DO block with information_schema existence check — donor DBs
keep backfill behavior; fresh DBs no-op. Evidence: ShadyERP schema.prisma has
totalRefund (donor), Altora 0003 uses refundAmount (target).

## Verdict: PASS (ChatGPT Web) — acceptance criteria all met
## Known risks: none outstanding; migration content changed (documented above)
## Rollback: revert commit 8982a245
