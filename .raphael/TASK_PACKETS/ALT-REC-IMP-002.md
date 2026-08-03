# TASK PACKET — ALT-REC-IMP-002

TASK ID: ALT-REC-IMP-002
TITLE: Authorization Foundation — server-side role guards for Market

OBJECTIVE:
Implement server-side role authorization on all Market protected routes per AUTHORIZATION-MATRIX.md, using the role already present in the session (OWNER/MANAGER/STAFF). No auth mechanism change, no data model change — only enforcement of the documented permission model.

CURRENT BEHAVIOR:
(auth.ts) NextAuth credentials login, session carries id/name/email/tenantId/tenantName/role. (protected)/layout.tsx checks only `user.id && user.role` (any role passes any route). Grep confirms ZERO assertRole/requireRole usage. Any authenticated STAFF can open /pengaturan, /laporan, /audit-log etc. by direct URL.

VERIFIED EXISTING CAPABILITY:
- Session role available in every server component via auth()
- market-auth-policy.mjs exists (callback sanitizer only — not role auth)
- All route pages are server components (async pages calling auth())

MISSING CAPABILITY:
- assertRole/requireRole server helper
- Route-level enforcement per matrix

REQUIRED ENFORCEMENT (from AUTHORIZATION-MATRIX.md, approved):
- OWNER only: /pengaturan (+bisnis, modul, karyawan, outlet), /audit-log
- OWNER|MANAGER: /laporan, /pengeluaran, /produk, /produk/transfer, /opname, /penerimaan, /promo, /voucher, /kasir/riwayat (void/correct)
- OWNER|MANAGER|STAFF: /kasir, /member, /absensi

RELEVANT FILES:
- apps/market/lib/ (new: market-authz.mjs or .ts)
- apps/market/app/(protected)/**/page.tsx (route guards)
- apps/market/auth.ts, auth.config.ts (context only)

ALLOWED FILES: apps/market/lib/, apps/market/app/(protected)/**, tests
FORBIDDEN FILES: apps/resto/**, apps/admin/**, packages/**, db/migrations/**, auth.ts mechanism, tenant/role model, production config

BUSINESS INVARIANTS:
- Roles unchanged (OWNER/MANAGER/STAFF); no new roles
- No hidden-navigation-only authorization (must be server-side)
- No route parity claims — this task is enforcement, not feature parity

SECURITY REQUIREMENTS:
- Unauthorized access → redirect to a safe page (not 500)
- Guards run server-side; client nav hiding is NOT sufficient
- No role escalation path introduced

REQUIRED TESTS:
- Unit: guard helper (allowed role, denied role, missing session)
- Route smoke: typecheck + build must pass
- Browser (later slice): STAFF blocked from /pengaturan

ACCEPTANCE CRITERIA:
1. assertRole(roles) helper in apps/market/lib, unit-tested
2. All matrix routes enforce their role set (grep-verifiable: every route page calls guard or inherits from a guarded layout)
3. Unauthorized → redirect (302) to /simple/hari-ini, not error
4. npm run check-types + lint + test pass
5. No change to auth.ts mechanism, role model, or migrations
6. ChatGPT Web review PASS

ROLLBACK: revert the commit; guards are additive, no data touched.

STOP CONDITIONS:
- Role model change needed → STOP, escalate (USER_GATE)
- Auth mechanism change needed → STOP, escalate

RECOMMENDED IMPLEMENTER: Antigravity (with fallback OpenCode)
