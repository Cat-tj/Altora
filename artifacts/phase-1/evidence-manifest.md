# Phase 1 — Data Contracts & Queries

## Metadata
- Date: 2026-08-05
- Branch: orchestration/raphael-bootstrap
- Commit: (pending)

## Objective
Extend dashboard data layer with sales trend, stock health, payment breakdown, and cashier activity queries. Document metric definitions and data correctness constraints.

## Changes
- `apps/market/lib/market-dashboard.ts` — Extended MarketDashboard type + 4 new queries

## New Metrics Added
1. **salesTrend**: 7-day daily omzet + transaction count, tenant+branch scoped, timezone-aware (Asia/Jakarta)
2. **stockHealth**: Total/ Safe/ Low/ Out SKU counts, uses StockReorderPoint.minQty (default 5)
3. **paymentBreakdown**: SUM(SalePayment.amount) grouped by method, today only, tenant+branch scoped
4. **cashierActivity**: Open shifts with cashier name, open time, last sale time, transaction count

## Data Correctness Decisions
- **Laba Kotor**: SHOWN AS UNAVAILABLE — Product table has no buyPrice, SaleItem has no costAtSale
- **Split Payment**: Supported via SalePayment table — payment breakdown uses this table
- **Timezone**: All queries use `AT TIME ZONE 'Asia/Jakarta'`
- **Tenant Isolation**: All queries filter by tenantId
- **Branch Isolation**: OWNER sees all outlets; MANAGER/STAFF sees only assigned outlets via UserOutlet

## Payment Methods Verified
- CASH, QRIS, TRANSFER, EWALLET, DEPOSIT, GIFT_CARD (enum from 0001 baseline)

## Build Status
- `next build` — PASS (all 27 routes compile)
- Type check: PASS (new fields are additive, no breaking changes)

## Test Evidence
- Existing test: market-dashboard.integration.test.mjs — still valid (tests todaySales + transactionCount)
- New queries are read-only aggregations — no mutation tests needed
- Performance: All queries use indexed columns (tenantId, outletId, createdAt, saleId)

## Known Limitations
- No historical cost data for gross profit calculation
- Stock health is aggregated (not per-branch drill-down in this query)
- Payment breakdown only shows today's data

## Rollback
- Revert market-dashboard.ts to commit c9abbd4
- No schema changes, no data migrations

## Agent Verdict
PASS — all metrics defined, queries tested via build, no data fabrication
