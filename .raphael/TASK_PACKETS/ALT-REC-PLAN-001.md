# TASK PACKET — ALT-REC-PLAN-001

TASK ID: ALT-REC-PLAN-001
TITLE: Reconcile Altora Recovery Sources

OBJECTIVE:
Rekonsiliasi seluruh dokumen recovery (audit, parity matrix, authorization matrix, salvage matrix, execution plan, migration contract, source inventory) terhadap kode aktual pada archive baseline 415efc4, lalu tentukan SATU vertical slice pertama yang paling aman untuk implementasi.

CURRENT BEHAVIOR:
Baseline berada di archive/failed-rewrite-2026-08-03 (415efc4). Dokumen recovery tersebar di dua tempat: docs/migrations/ (di baseline) dan docs/recovery/ (di branch audit/altora-recovery-docs, belum di-merge). Belum ada task packet terverifikasi.

VERIFIED EXISTING CAPABILITY (dari inspeksi kode baseline):
1. Auth session (Auth.js) aktif di (protected)/layout.tsx — cek session + role, redirect /login bila tidak ada.
2. Market POS backend nyata di apps/market/lib/market-pos.ts: listAccessibleMarketOutlets, getOpenMarketShift, openMarketShift, listMarketPosProducts, createMarketSale, listMarketSales, getMarketSale, voidMarketSale, getMarketShiftSummary, closeMarketShift.
3. Kasir page 11 baris (thin wrapper) → pos-screen.tsx 18 baris + open/close-shift-form + actions.ts (shift, sale).
4. Route lengkap: kasir, riwayat, struk/[saleId], tutup/[shiftId], produk, produk/transfer, opname, penerimaan, retur, promo, voucher, member, laporan, pengeluaran, absensi, audit-log, pengaturan, simple/hari-ini.
5. Migration set 0001–0008 di apps/market/db/migrations/.
6. Goods receiving: penerimaan/page.tsx 136 baris (terisi).
7. Schema mandiri market (bukan menumpang donor).

MISSING CAPABILITY (dari audit + inspeksi):
1. Server-side role authorization guard (assertRole/assertSuperAdmin) — TIDAK ADA satupun di apps/market (grep 0 hasil). Semua route owner-only bisa diakses role lain via URL langsung. SECURITY GAP.
2. Migration runner aman — ensure-market-schema.mjs masih .split(";") (baris 24), rawan 08P01/statement pecah.
3. UI manajer kaya donor: variant picker, payment sheet split, BOGO promo manager, member RFID/deposit, itemized retur dengan refund calc, stock opname variance, product recipe/BOM, supplier/PO manager, KDS resto.
4. Retur (88 baris), opname (125 baris), promo (158 baris), hari-ini (15 baris), laporan (62 baris) = shell tipis.

RELEVANT FILES:
- docs/migrations/MARKET-MIGRATION-CONTRACT.md, MARKET-SOURCE-INVENTORY.md, EXECUTION-LOOP.md
- docs/architecture/PRODUCT-BOUNDARIES.md
- docs/recovery/ALTORA-RECOVERY-AUDIT.md, FEATURE-PARITY-MATRIX.md, AUTHORIZATION-MATRIX.md, SALVAGE-MATRIX.md, RECOVERY-EXECUTION-PLAN.md (branch audit/altora-recovery-docs)
- apps/market/scripts/ensure-market-schema.mjs
- apps/market/lib/market-pos.ts
- apps/market/app/(protected)/** (routes)

ALLOWED FILES: .raphael/ (ledger, task packets, reports) — docs ini
FORBIDDEN FILES: apps/**, packages/**, prisma/**, db/**, migration SQL, package.json, turbo.json, .github/**, semua selain .raphael/

BUSINESS INVARIANTS:
- ShadyERP = canonical functional reference; copy behavior, jangan rewrite buta.
- Verified Altora transaction cores (market-pos.ts) dievaluasi dulu sebelum diganti.
- Tanpa fake product shells; tanpa authorization via hidden navigation.
- Route parity TIDAK dihitung dari jumlah route.

SECURITY REQUIREMENTS:
- Tidak ada perubahan auth/role model pada tahap planning ini.
- Temuan authorization gap DICATAT sebagai blocker prioritas untuk slice berikutnya, bukan di-fix di planning.

REQUIRED TESTS (untuk planning ini):
- Verifikasi klaim dokumen vs kode aktual (dilakukan: grep, wc -l, file inspection).
- Verifikasi SHA canonical: ShadyERP 5fb0dfb (via GitHub API, OK) & Altora 415efc4 (OK).

ACCEPTANCE CRITERIA:
1. Semua 5 dokumen recovery dibaca dan direkonsiliasi.
2. Kode baseline diinspeksi (route, lib, migration runner, auth guard).
3. Status tiap kandidat slice dinilai dengan kriteria: risiko, dampak, dependency, testability, kebutuhan migration.
4. Tepat SATU slice direkomendasikan dengan rationale.
5. Task packet + report tersimpan di .raphael/.
6. Verdict: READY_FOR_USER_APPROVAL | REVISE | BLOCKED.

ROLLBACK: Tidak ada perubahan kode aplikasi; rollback = hapus branch orchestration/raphael-bootstrap bila ditolak.

STOP CONDITIONS:
- Jika ditemukan kontradiksi dokumen yang butuh keputusan user → BLOCKED + consult.
- Jika tidak ada slice yang lolos kriteria → REVISE.

RECOMMENDED IMPLEMENTER: Raphael (orchestrator) — planning internal, tanpa implementer eksternal.
