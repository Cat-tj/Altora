# REPORT — ALT-REC-PLAN-001

Branch: orchestration/raphael-bootstrap
Base SHA: 415efc4b4cc6ac8532f0e29608d8bec04e1fed42
Ledger Commit SHA: 2e7f7bedb621c587ddaf7a1120c27b82416c8ce0
Planning Commit SHA: (ditentukan setelah commit)
Task ID: ALT-REC-PLAN-001 — Reconcile Altora Recovery Sources

## 1. Rekonsiliasi Sumber

| Sumber | Klaim | Verifikasi kode aktual | Status |
| --- | --- | --- | --- |
| EXECUTION-LOOP.md | Market MVP operasional fase 3–6, schema mandiri | market-pos.ts 10 fungsi nyata; migrations 0001–0008; kasir→pos-screen | ✅ KONFIRMASI |
| EXECUTION-LOOP.md | Promo/retur/opname/import belum dipindah | retur 88 baris, opname 125, promo 158 — shell tipis | ✅ KONFIRMASI |
| ALTORA-RECOVERY-AUDIT.md | Verdict REVISE; migration runner unsafe | ensure-market-schema.mjs baris 24 .split(";") | ✅ KONFIRMASI |
| ALTORA-RECOVERY-AUDIT.md | Role guard server-side missing | grep assertRole = 0 hasil di apps/market | ✅ KONFIRMASI |
| FEATURE-PARITY-MATRIX.md | 118 model / 68 enum di ShadyERP; POS/Retur/Promo PARTIAL | Tidak dibantah oleh kode baseline | ✅ KONSISTEN |
| AUTHORIZATION-MATRIX.md | SUPERADMIN/OWNER/MANAGER/STAFF; enforcement di route | Enforcement guard TIDAK ADA di kode | ⚠️ GAP TERKONFIRMASI |
| RECOVERY-EXECUTION-PLAN.md | 6 fase; Phase 1 = migration infra | Sesuai kebutuhan nyata | ✅ KONSISTEN |
| MARKET-MIGRATION-CONTRACT.md | Rilis 0.2.6 slice operasional Market | Sesuai isi apps/market | ✅ KONSISTEN |
| PRODUCT-BOUNDARIES.md | Batas produk via katalog @altora/core | apps/ sesuai struktur | ✅ KONSISTEN |

## 2. Penilaian Kandidat Slice

Kriteria: risiko rendah, dampak tinggi, dependency sedikit, testability kuat, tanpa production migration, satu outcome terverifikasi.

| Kandidat | Risiko | Dampak | Dependency | Testability | Migration? | Skor |
| --- | --- | --- | --- | --- | --- | --- |
| POS checkout | Sedang | Tinggi | Variants/modifiers/payment — banyak | Sedang | Tidak | 3/5 |
| Retur | Tinggi (finansial) | Sedang | Refund calc, koreksi pembayaran | Sedang | Mungkin | 2/5 |
| Stock opname | Rendah | Sedang | Stock ledger | Baik | Tidak | 4/5 |
| Promo BOGO | Tinggi (kompleks) | Sedang | Integrasi checkout | Sedang | Tidak | 2/5 |
| Goods receiving | Rendah | Sedang | Supplier/PO belum ada | Baik | Tidak | 3/5 |
| Authorization foundation | Sedang (broad) | TINGGI (security) | Role model — butuh DEC | Baik | Tidak | 4/5 |
| **Migration runner** | **Rendah** | **Tinggi (enabler)** | **Minimal** | **Terkuat** | **Tidak** | **5/5** |

## 3. Rekomendasi Slice Pertama

**RECOMMENDED: MIGRATION RUNNER** (fix ensure-market-schema.mjs / ensure-resto-schema.mjs)

Alasan:
1. **Dependency wajib** — setiap slice berikutnya (retur, opname, promo, POS, resto) bergantung pada migrasi yang aman. Audit menandainya critical blocker #1; commit history penuh kegagalan (08P01, pooler, statement pecah).
2. **Risiko terendah** — tooling murni: satu script + test harness. Tidak menyentuh app code, schema, data production, atau UI.
3. **Tidak butuh production migration** — memperbaiki runner ≠ mengeksekusi migrasi. Tidak butuh approval data.
4. **Testability terkuat** — dapat diuji terhadap disposable test DB (Postgres): jalankan set migrasi penuh 0001–0008, verifikasi per-statement error reporting, verifikasi transaksi/rollback pada kegagalan, idempotensi.
5. **Satu outcome terverifikasi** — "runner mengeksekusi migration set secara aman dengan error reporting yang jelas, dibuktikan di disposable DB".

Slice kedua yang disarankan (setelah runner): **Authorization foundation** — security gap terkonfirmasi (0 guard), enabler untuk semua route.

## 4. Verdict

**READY_FOR_USER_APPROVAL**

Bukan READY_FOR_IMPLEMENTATION — implementasi belum disetujui. Menunggu keputusan user pada rekomendasi slice pertama.
