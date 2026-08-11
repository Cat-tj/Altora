# Phase 0 — Baseline & Safety

## Metadata
- Date: 2026-08-05
- Branch: orchestration/raphael-bootstrap
- Repository: Altora (monorepo)
- Market app: apps/market

## Build Status
- `next build` — PASS (all 27 routes compile clean)
- No existing build errors

## Git Status
- Working directory: clean (no uncommitted changes)
- Latest commit: c9abbd4 "fix: add null session guard to expenses and members API routes"

## AppShell Consumers
- `apps/market` — primary consumer (imports AppShell component + CSS)
- `apps/admin` — CSS override only (`.app-shell { min-height: 100vh; }`)
- `apps/resto` — CSS override only (`.app-shell { min-height: 100vh; }`)
- `apps/landing` — CSS override only (`.app-shell { min-height: 100vh; }`)

## CSS Blast Radius
- `packages/ui/src/tokens.css` (134 lines) — shared design tokens
- `packages/ui/src/app-shell.css` (356 lines) — AppShell layout + sidebar + responsive
- `packages/ui/src/drawer-shared.css` (288 lines) — mobile drawer
- `apps/market/app/globals.css` (754 lines) — Market-specific styles

## Existing Tests (15 files)
- market-dashboard.integration.test.mjs
- market-pos.integration.test.mjs
- market-authz-policy.test.mjs
- market-auth-policy.test.mjs
- market-expenses.integration.test.mjs
- market-returns.integration.test.mjs
- market-attendance.integration.test.mjs
- market-stock-ledger.integration.test.mjs
- market-receiving.integration.test.mjs
- market-stock-ops.integration.test.mjs
- market-hardening.integration.test.mjs
- market-pos-enrichment.integration.test.mjs
- market-rate-limit.test.mjs
- sql-splitter.test.mjs
- promo-calc.test.ts

## Baseline Screenshots
- `artifacts/phase-0/baseline-dashboard.png` — current dashboard (/simple/hari-ini)
- `artifacts/phase-0/baseline-pos.png` — current POS (/kasir)

## Current Dashboard State
- 4 KPI cards (Omzet, Transaksi, Rata-rata Belanja, Shift Aktif)
- 2 panels (Perlu ditindak, Produk terlaris)
- Flat white design, no gradient, no glassmorphism
- Solid magenta hero KPI card
- Sidebar: floating white panel, 16px radius
- No sales trend chart
- No payment breakdown
- No stock health overview
- No cashier activity panel

## Current POS State
- Product grid with category chips
- Cart sidebar
- Search bar
- Category filter chips
- Product cards with barcode, price, stock

## Build Commands
- Build: `cd apps/market && npx next build`
- Dev: `cd apps/market && npx next dev --port 3002`
- Lint: `npm run lint` (from root)
- Tests: `npm run test:market` (from root)

## Safety Notes
- No secrets in evidence
- No PII in screenshots (dummy data only)
- All changes will be additive (CSS new classes, new components)
- Rollback: git revert to c9abbd4

## Agent Verdict Before Review
PASS (local baseline established, no issues found)
