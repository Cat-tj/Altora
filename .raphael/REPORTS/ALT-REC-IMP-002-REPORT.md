# REPORT — ALT-REC-IMP-002 (Authorization Foundation)

Branch: orchestration/raphael-bootstrap
Base SHA: 415efc4b4cc6ac8532f0e29608d8bec04e1fed42
Implementation SHA: (set at commit)
Task ID: ALT-REC-IMP-002 — Server-side role guards for Market routes
Implementer: Antigravity (code gen) + Raphael (apply/fix) — diff streaming corrupt, applied deterministically
Reviewer: ChatGPT Web (chatgpt-web/gpt-5.5) — REVISE (evidence gaps) → re-review after this report

## Authoritative route → role inventory (source of truth for route-level authz)

| Route (page.tsx) | Allowed roles | Guard |
| --- | --- | --- |
| /pengaturan | OWNER | requireRole(["OWNER"]) |
| /audit-log | OWNER | requireRole(["OWNER"]) |
| /laporan | OWNER, MANAGER | requireRole(["OWNER","MANAGER"]) |
| /pengeluaran | OWNER, MANAGER | requireRole(["OWNER","MANAGER"]) |
| /produk | OWNER, MANAGER | requireRole(["OWNER","MANAGER"]) |
| /produk/transfer | OWNER, MANAGER | requireRole(["OWNER","MANAGER"]) |
| /opname | OWNER, MANAGER | requireRole(["OWNER","MANAGER"]) |
| /penerimaan | OWNER, MANAGER | requireRole(["OWNER","MANAGER"]) |
| /promo | OWNER, MANAGER | requireRole(["OWNER","MANAGER"]) |
| /voucher | OWNER, MANAGER | requireRole(["OWNER","MANAGER"]) |
| /kasir | OWNER, MANAGER, STAFF | requireRole(["OWNER","MANAGER","STAFF"]) |
| /kasir/riwayat | OWNER, MANAGER, STAFF (view); void/correct actions OWNER|MANAGER — NOT YET ENFORCED at action level | requireRole(["OWNER","MANAGER","STAFF"]) |
| /member | OWNER, MANAGER, STAFF | requireRole(["OWNER","MANAGER","STAFF"]) |
| /absensi | OWNER, MANAGER, STAFF | requireRole(["OWNER","MANAGER","STAFF"]) |

Not in matrix (unchanged, layout-level auth only): /simple/hari-ini, /kasir/struk/[saleId], /kasir/tutup/[shiftId].

## Behavior contract

- Unauthenticated (no session / no user.id / no user.role) → redirect("/login")
- Authenticated but role not in allowed set → redirect("/simple/hari-ini")
- Unknown/missing/malformed role → deny-by-default (isRoleAllowed returns false; unit tested)
- Guards execute server-side (all pages are async server components calling requireRole before any data fetch)
- No client-side-only hiding; navigation hiding is additive, not the enforcement

## Evidence

- Unit tests (apps/market): 25 total, 23 pass, 0 fail (7 new authz tests incl. deny-by-default & malformed input)
- eslint --max-warnings 0 on touched files: CLEAN
- tsc --noEmit apps/market: zero errors from app code (only pre-existing node_modules type noise)
- grep: 0 remaining direct auth() calls in the 14 target pages; 14/14 use requireRole
- No auth.ts mechanism change; no role model change; no migrations; no resto/admin/landing touched

## Known limitations (explicit, tracked)

1. Server-action enforcement (void/correct mutations, create/update/delete actions) NOT yet role-checked — route-level only. Follow-up task: ALT-REC-IMP-005 (action-level authz) when implementing those slices.
2. Tenant/outlet scoping: requireRole returns tenantId; pages already filter queries by tenantId. A full cross-tenant access audit (every query in every action) is a separate verification task — tracked as follow-up.
3. Browser E2E (STAFF blocked from /pengaturan via real URL) requires running app + seeded DB — NOT VERIFIED (environment limitation), deferred to the deploy smoke slice.

## Verdict: REVISE addressed → resubmitted for PASS
## Rollback: revert implementation commit; guards are additive, no data touched
