Workflow Status: AWAITING_APPROVAL
Audit Verdict: REVISE
Implementation Approval: DENIED

# FEATURE PARITY MATRIX — SHADYERP VS. ALTORA

## 1. Baseline Identifiers & Exact Metrics

* **Source of Truth Repository:** `https://github.com/Cat-tj/ShadyERP`
* **Source Immutable SHA:** `5fb0dfb5db923235194f7e19922eba45e023239e`
* **Target Repository:** `https://github.com/Cat-tj/Altora`
* **Target Immutable SHA:** `415efc4b4cc6ac8532f0e29608d8bec04e1fed42`

Command executed to count exact schema objects:
```bash
grep -c "^model " /Users/icat/ShadyERP/prisma/schema.prisma
grep -c "^enum " /Users/icat/ShadyERP/prisma/schema.prisma
```

Output:
```text
118
68
```

* **Exact ShadyERP Prisma Models:** 118
* **Exact ShadyERP Prisma Enums:** 68

---

## 2. Feature Parity Matrix

| Module / Feature Domain | ShadyERP Baseline (`5fb0dfb`) | Altora Target (`415efc4`) | Parity Status | Evidence & Missing Elements | Recovery Decision |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Authentication & AuthGuard** | NextAuth v5, tenant session binding, SuperAdmin isolated auth session | Auth.js in Market & Resto protected layout | PARTIAL | Auth guard active, but role authorization & outlet scoping missing on server page routes | MERGE |
| **POS Kasir Screen** | Full `pos-screen.tsx`, `payment-sheet.tsx`, `variant-picker-modal.tsx`, shift open/close, RawBT receipt printing | Core cart & `@altora/pos-core` backend present in `kasir/page.tsx` | PARTIAL | Missing UI modals for variants, modifiers, BOGO promo rules, member deposit, split payment | RESTORE FROM SHADYERP |
| **Transaction History & Retur** | `riwayat-list.tsx`, void with reason, itemized return with refund calculation, payment method correction | Basic list table in `kasir/riwayat/page.tsx` | PARTIAL | Itemized return DB table exists (`SaleReturn`), but refund calculation & payment correction modals missing from UI | RESTORE FROM SHADYERP |
| **Product & BOM Recipe** | `produk-manager.tsx`, `recipe-editor.tsx`, `variant-groups-editor.tsx`, `wholesale-tier-editor.tsx`, `label-barcode-manager.tsx` | Simple product list and creation form in `produk/page.tsx` | PARTIAL | Missing BOM recipe editor, wholesale tier pricing editor, and barcode label printer component | RESTORE FROM SHADYERP |
| **Stock Opname** | `stock-count-manager.tsx`, physical vs system count variance calculation, approval workflow, stock adjustment ledger | Table view in `opname/page.tsx` | PARTIAL | Physical vs system count variance entry form and stock adjustment ledger write missing from UI | RESTORE FROM SHADYERP |
| **Stock Transfer** | `transfer-stok-manager.tsx`, inter-outlet transfer request, approval, shipping, receipt confirmation | Simple transfer form in `produk/transfer/page.tsx` | PARTIAL | Missing multi-step approval state machine and double-confirmation receipt workflow | RESTORE FROM SHADYERP |
| **Purchase Order & Goods Receipt** | `purchase-order-manager.tsx`, `stock-receipt-manager.tsx`, `supplier-manager.tsx`, PO state transition, QC breakdown | Basic receipt form in `penerimaan/page.tsx` | PARTIAL | Missing PO linkage, QC defect breakdown, and supplier invoice matching | RESTORE FROM SHADYERP |
| **Member & RFID Loyalty** | `member-profile.tsx`, `assign-card-form.tsx`, `register-member-form.tsx`, deposit balance top-up, RFID card scanner | Member table in `member/page.tsx` | PARTIAL | Missing RFID card assignment modal, deposit balance top-up form, and point tiering view | RESTORE FROM SHADYERP |
| **Promo & BOGO** | `promo-manager.tsx`, `simple-promo-manager.tsx`, BOGO (Buy X Get Y), tier discounts, min spend, qualifying product mapping | Promo list in `promo/page.tsx` | PARTIAL | Fixed `22P02` enum query bug, but BOGO rule builder and qualifying product selector missing from UI | RESTORE FROM SHADYERP |
| **Finance & Pengeluaran** | `pengeluaran-manager.tsx`, `profit-loss-summary.tsx`, `period-lock-manager.tsx`, COA profit & loss, trial balance | Simple expense list in `pengeluaran/page.tsx` | PARTIAL | Missing COA accounting profit & loss summary and period lock manager | RESTORE FROM SHADYERP |
| **Absensi & HRIS** | `attendance-dashboard.tsx`, `kpi-goal-manager.tsx`, photo & GPS clock-in/out, shift schedule | Attendance list in `absensi/page.tsx` | PARTIAL | Missing GPS/photo capture and KPI goal manager | RESTORE FROM SHADYERP |
| **Resto — Kitchen Display (KDS)** | `kitchen-display.tsx`, live order queue (PENDING → COOKING → READY → SERVED), order timer, audio alert | Card grid in `resto/dapur/page.tsx` | PARTIAL | Missing live websocket/polling status toggle and order timer | RESTORE FROM SHADYERP |
| **Resto — Denah Meja** | `meja-manager.tsx`, interactive visual table canvas editor, position (X,Y), capacity, QR token generator | Table list in `resto/meja/page.tsx` | PARTIAL | Missing visual drag-and-drop table canvas editor and QR token generator | RESTORE FROM SHADYERP |
| **Resto — QR Customer Order** | `order-menu.tsx`, QR token scanner, table menu view, item customization, instant table order submission | Menu list in `resto/pesan/[qrToken]/page.tsx` | PARTIAL | Missing full cart customization and QR token validation handler | RESTORE FROM SHADYERP |
| **Audit Log & SuperAdmin** | `superadmin/` managers, immutable audit log trail (actor, action, before/after JSON) | Audit log table in `audit-log/page.tsx` | PARTIAL | Missing SuperAdmin tenant management and JSON diff inspector | RESTORE FROM SHADYERP |
