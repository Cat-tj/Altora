Workflow Status: AWAITING_APPROVAL
Audit Verdict: REVISE
Implementation Approval: DENIED

# SALVAGE MATRIX — ALTORA RECOVERY

## 1. Overview & Baseline Identifiers

* **Source of Truth Repository:** `https://github.com/Cat-tj/ShadyERP`
* **Source Immutable SHA:** `5fb0dfb5db923235194f7e19922eba45e023239e`
* **Target Repository:** `https://github.com/Cat-tj/Altora`
* **Target Immutable SHA:** `415efc4b4cc6ac8532f0e29608d8bec04e1fed42`

Decisions are strictly categorized as:
- `RESTORE FROM SHADYERP`
- `KEEP FROM ALTORA`
- `MERGE`
- `DELETE`
- `REQUIRES TEST`

---

## 2. Salvage Decisions Matrix

| Target Component / Module Path | Source File in ShadyERP | Decision | Justification & Verification Method |
| :--- | :--- | :--- | :--- |
| `packages/ui/src/product-shell.tsx` | N/A (New in Altora) | `KEEP FROM ALTORA` | Modern design system wrapper with brand design tokens. Verified via `npm run check-types`. |
| `packages/pos-core/src/checkout.js` | N/A (Extracted in Altora) | `MERGE` | Contains idempotent checkout, stock lock, and transaction rollback logic. Must merge with ShadyERP variant UI. |
| `apps/market/scripts/ensure-market-schema.mjs` | N/A (New script) | `DELETE` | Split-string `.split(";")` runner fails silently on SQL blocks. Replace with strict psql/transaction runner. |
| `ShadyERP/src/components/kasir/pos-screen.tsx` | `src/components/kasir/pos-screen.tsx` | `RESTORE FROM SHADYERP` | Complete POS screen with variant picker, member picker, and split payment. Must restore to `@altora/market`. |
| `ShadyERP/src/components/kasir/payment-sheet.tsx` | `src/components/kasir/payment-sheet.tsx` | `RESTORE FROM SHADYERP` | Split payment modal (Cash, QRIS, Transfer, Deposit). Must restore to `@altora/market`. |
| `ShadyERP/src/components/kasir/variant-picker-modal.tsx` | `src/components/kasir/variant-picker-modal.tsx` | `RESTORE FROM SHADYERP` | Product variant selection modal. Must restore to `@altora/market`. |
| `ShadyERP/src/components/kasir/riwayat-list.tsx` | `src/components/kasir/riwayat-list.tsx` | `RESTORE FROM SHADYERP` | Itemized retur, refund calculation, void reason modal, and payment correction. Must restore to `@altora/market`. |
| `ShadyERP/src/components/produk/produk-manager.tsx` | `src/components/produk/produk-manager.tsx` | `RESTORE FROM SHADYERP` | Complete Product CRUD with variant editor, BOM recipe editor, and wholesale tier pricing. |
| `ShadyERP/src/components/produk/recipe-editor.tsx` | `src/components/produk/recipe-editor.tsx` | `RESTORE FROM SHADYERP` | BOM Recipe editor for ingredient stock deductions. Must restore to `@altora/market` & `@altora/resto`. |
| `ShadyERP/src/components/produk/label-barcode-manager.tsx` | `src/components/produk/label-barcode-manager.tsx` | `RESTORE FROM SHADYERP` | Barcode SVG generator and thermal label printer manager. Must restore to `@altora/market`. |
| `ShadyERP/src/components/stock-count/stock-count-manager.tsx` | `src/components/stock-count/stock-count-manager.tsx` | `RESTORE FROM SHADYERP` | Physical vs system count entry form, variance calculation, and adjustment ledger write. |
| `ShadyERP/src/components/produk/transfer-stok-manager.tsx` | `src/components/produk/transfer-stok-manager.tsx` | `RESTORE FROM SHADYERP` | Inter-outlet transfer request, approval, and receipt confirmation workflow. |
| `ShadyERP/src/components/stock-receipt/stock-receipt-manager.tsx` | `src/components/stock-receipt/stock-receipt-manager.tsx` | `RESTORE FROM SHADYERP` | Purchase order receipt with QC defect tracking and supplier invoice matching. |
| `ShadyERP/src/components/member-portal/assign-card-form.tsx` | `src/components/member-portal/assign-card-form.tsx` | `RESTORE FROM SHADYERP` | RFID UID card scanner & member assignment modal. Must restore to `@altora/market`. |
| `ShadyERP/src/components/pengaturan/promo-manager.tsx` | `src/components/pengaturan/promo-manager.tsx` | `RESTORE FROM SHADYERP` | BOGO (Buy X Get Y) promo rule builder and qualifying product selector. Must restore to `@altora/market`. |
| `ShadyERP/src/components/pesanan-meja/pesanan-masuk-manager.tsx` | `src/components/pesanan-meja/pesanan-masuk-manager.tsx` | `RESTORE FROM SHADYERP` | Live KDS kitchen display system with status timers and order alerts. Must restore to `@altora/resto`. |
| `ShadyERP/src/components/pengaturan/meja-manager.tsx` | `src/components/pengaturan/meja-manager.tsx` | `RESTORE FROM SHADYERP` | Visual drag-and-drop table canvas editor and QR token generator. Must restore to `@altora/resto`. |
| `ShadyERP/src/components/pengaturan/bisnis-form.tsx` | `src/components/pengaturan/bisnis-form.tsx` | `RESTORE FROM SHADYERP` | Store profile, sales tax %, receipt footer message, and static QRIS payload editor. |
| `ShadyERP/src/components/pengaturan/karyawan-manager.tsx` | `src/components/pengaturan/karyawan-manager.tsx` | `RESTORE FROM SHADYERP` | Staff management, role selection, and cashier PIN assignment modal. Must restore to `@altora/market`. |
| `ShadyERP/src/components/pengaturan/modifier-manager.tsx` | `src/components/pengaturan/modifier-manager.tsx` | `RESTORE FROM SHADYERP` | Modifier group & topping selection manager. Must restore to `@altora/resto` & `@altora/market`. |
| `apps/market/lib/db.ts` | N/A (New in Altora) | `KEEP FROM ALTORA` | Pure `pg` pool connector with SSL support for Supabase connection pooler. Verified via test execution. |
| `turbo.json` | N/A (New in Altora) | `KEEP FROM ALTORA` | Workspace configuration with `DIRECT_URL` env declaration. Verified via `npm run lint`. |
| `apps/market/lib/market-promos.ts` | N/A (New in Altora) | `MERGE` | Contains `::text` cast fix for `PromoDiscountType` enum. Merge with ShadyERP BOGO promo manager. |
| `apps/market/lib/market-attendance.ts` | N/A (New in Altora) | `MERGE` | Contains `COALESCE(clockIn, clockInAt)` fallback logic. Merge with ShadyERP attendance dashboard. |
