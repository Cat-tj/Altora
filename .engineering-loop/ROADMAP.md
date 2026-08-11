# Altora Verified Engineering Loop

This is a bounded execution ledger. A phase is complete only when its evidence file exists and the command exits 0.

## Completed checkpoints

- `baseline`: boundaries, type checks, and workspace tests.
- `service-runtime`: Altora Service production build.
- `inventory-contracts`: Inventory core contract tests.
- `all-app-builds`: landing, resto, admin, and Market production build chain.
- `all-workspace-tests`: complete workspace test command.
- `service-http`: live Altora Service development server returned HTTP 200 on `/`.

## Next executable checkpoints

1. `database-contracts`: run DB package checks with a real PostgreSQL `DATABASE_URL`.
2. `tenant-isolation`: prove tenant-scoped queries cannot cross tenant boundaries.
3. `inventory-adapter`: connect inventory ledger to persistence and test idempotency/replay.
4. `market-runtime`: start Market and verify public-facing routes/API.
5. `resto-runtime`: start Resto and verify auth, tRPC, notifications, reports, settings.
6. `service-persistence`: replace mock Service catalog/staff with DB-backed routes.
7. `browser-qa`: capture desktop/mobile screenshots and inspect console/network errors.
8. `vps-deploy`: deploy only after local/runtime gates pass; verify listener and domains.
9. `critic-pass`: submit evidence packet for independent visual/product review.

## Rules

- Never mark a checkpoint passed without command output and saved evidence.
- Stop at the first failed gate and repair the smallest slice.
- Keep `.engineering-loop/state.json` and `evidence/*.json` as the audit trail.
- Do not treat static build success as proof of database isolation or deployment health.

## Current repository facts

- Repo: `/Users/icat/Projects/Altora`
- Branch: `orchestration/raphael-bootstrap`
- Graph project: `Users-icat-Projects-Altora`
- Graph status before this turn: ready, 1704 nodes, 3020 edges.
