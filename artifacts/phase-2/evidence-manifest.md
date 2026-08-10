# Phase 2 — Shared Shell & Market Theme

## Metadata
- Date: 2026-08-05
- Branch: orchestration/raphael-bootstrap
- Commits: 046f8ee (phase-1), d2db5dd (phase-2)

## Objective
Add header slot to AppShell, Market ambient gradient, glass surfaces, and MarketGlobalHeader.

## Changes
1. `packages/ui/src/app-shell.tsx` — Added optional `header` slot + `data-theme` prop
2. `packages/ui/src/app-shell.css` — Added `.app-shell-header` styles
3. `apps/market/app/globals.css` — Added Market-scoped CSS:
   - Ambient gradient (4 radial glows on #f8f8fc)
   - Glass sidebar with backdrop-filter + fallback
   - Glass KPI cards (`.market-kpi-glass`)
   - Hero KPI gradient (`.market-kpi-hero`)
   - Glass panels (`.market-panel`)
   - Market header styles (`.market-header`)
4. `apps/market/app/market-shell.tsx` — Added `data-theme="market"` + header slot
5. `apps/market/app/(protected)/simple/hari-ini/page.tsx` — Removed duplicate header, added glass classes

## Architecture Decisions
- **AppShell stays generic**: header slot is optional, data-theme is opt-in
- **Market theme scoped**: All gradient/glass CSS under `[data-theme="market"]`
- **Fallback**: `@supports not (backdrop-filter: blur(1px))` for solid backgrounds
- **No shared package pollution**: Market-specific CSS lives in market globals.css

## Build Status
- `next build` — PASS (all 27 routes)
- Type check: PASS

## Visual Changes (from baseline)
- Sidebar: now semi-transparent glass with backdrop blur
- Background: soft radial gradient glows (purple, blue, pink, indigo)
- KPI cards: glass surface with subtle border
- Hero KPI (Omzet): purple→magenta gradient
- Content panels: glass surface
- Header: brand bar with "Buka Kasir" CTA

## Deployment Status
- Pushed to origin: orchestration/raphael-bootstrap
- VPS deployment: PENDING (requires user approval per approval gates)

## Rollback
- Revert commits d2db5dd and 046f8ee
- No schema changes

## Agent Verdict
PASS — all changes are additive, scoped, and build-clean
