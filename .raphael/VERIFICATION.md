# VERIFICATION

Evidence standard per report: Branch | Base SHA | Current SHA | Changed files | Diff summary | Commands executed | Exit codes | Tests passed/failed/skipped | Browser result | Security checks | Known risks | Rollback | Verdict.

Verdicts: PASS | REVISE | REJECT | BLOCKED | HANDOFF.

Layers: static (typecheck/lint/boundary/repo health) → unit (business calc, validation, permission helpers) → integration (real PostgreSQL, transaction, rollback, tenant/outlet isolation, idempotency) → browser (happy/error/empty/unauthorized/mobile/console) → security (direct URL, role escalation, tenant/outlet manipulation, ownership, sensitive data) → deployment (build artifact, env validation, health endpoint, rollback, smoke).

Skipped checks are reported as NOT VERIFIED, never PASS. Build success alone is never "done".
