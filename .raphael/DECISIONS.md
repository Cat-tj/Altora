# DECISIONS

Format: DEC-### | Date | Decision | Reason | Evidence | Status

DEC-001 | 2026-08-03 | ShadyERP is the canonical functional reference. | Recovery must preserve verified business behavior, not re-invent it. | User master prompt §19; MARKET-MIGRATION-CONTRACT.md | ACTIVE
DEC-002 | 2026-08-03 | Altora is the target monorepo. | Monorepo replaces the giant single-app pattern. | README.md; PRODUCT-BOUNDARIES.md | ACTIVE
DEC-003 | 2026-08-03 | Verified Altora transaction cores must be evaluated before replacement. | Don't discard working transaction logic in the failed-rewrite baseline. | EXECUTION-LOOP.md (Market MVP operational) | ACTIVE
DEC-004 | 2026-08-03 | No production database migration without explicit user approval. | Production safety gate. | User master prompt §13; EXECUTION-LOOP.md | ACTIVE
DEC-005 | 2026-08-03 | No application implementation begins before an approved task packet. | Evidence before claims; one task one outcome. | User master prompt §4, §7 | ACTIVE
DEC-006 | 2026-08-03 | The archive tag is immutable and must never be moved, deleted, or recreated. | Archive checkpoint integrity. | User approval message (Approval 1) | ACTIVE
