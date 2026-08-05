# Phase 1 — Data Contracts & Query Definitions

## Metric Definitions

### 1. Omzet Hari Ini (Today's Revenue)
- **Definition**: SUM(Sale.total) WHERE status = 'COMPLETED' AND createdAt >= start of today (Asia/Jakarta)
- **Scope**: tenant-scoped, branch-scoped (via outletId)
- **Source**: Sale table
- **Existing**: YES (getMarketDashboard)

### 2. Laba Kotor (Gross Profit)
- **Definition**: netSales - costOfGoodsSold
- **Problem**: NO cost-at-sale column in SaleItem. Product table has NO buyPrice.
- **Verdict**: CANNOT calculate. Must show honest unavailable state.
- **Blocker**: Schema gap — no `buyPrice` in Product, no `costAtSale` in SaleItem.

### 3. Transaksi (Transaction Count)
- **Definition**: COUNT(Sale.id) WHERE status = 'COMPLETED' AND createdAt >= start of today
- **Scope**: tenant-scoped, branch-scoped
- **Existing**: YES (getMarketDashboard)

### 4. Rata-rata Belanja (Average Transaction)
- **Definition**: omzet / transactionCount (only if count > 0)
- **Existing**: YES (computed in getMarketDashboard)

### 5. Shift Aktif (Active Shifts)
- **Definition**: COUNT(CashierShift.id) WHERE status = 'OPEN'
- **Scope**: tenant-scoped, branch-scoped
- **Existing**: YES (getMarketDashboard)

### 6. Sales Trend (7-day)
- **Definition**: Daily SUM(Sale.total) grouped by date for last 7 days
- **NEW QUERY NEEDED**

### 7. Stock Health
- **Definition**:
  - Total SKU: COUNT(Product) WHERE isActive = true AND kind = 'GOODS'
  - Safe: ProductStock.qty > minQty (from StockReorderPoint, default 5)
  - Low: ProductStock.qty > 0 AND ProductStock.qty <= minQty
  - Out: ProductStock.qty <= 0
- **NEW QUERY NEEDED**

### 8. Payment Breakdown
- **Definition**: SUM(SalePayment.amount) grouped by method
- **Scope**: tenant-scoped, branch-scoped, today only
- **Note**: SalePayment is the split payment table. For simple payments, there's 1 record per sale.
- **NEW QUERY NEEDED**

### 9. Cashier Activity
- **Definition**: Active shifts with cashier name, open time, last transaction
- **NEW QUERY NEEDED**

## Split Payment Support
- **YES**: SalePayment table exists (migration 0009)
- **Model**: Each Sale can have multiple SalePayment records
- **Reconciliation**: SUM(SalePayment.amount) should equal Sale.total for COMPLETED sales

## Payment Methods Available
- CASH
- QRIS
- TRANSFER
- EWALLET
- DEPOSIT
- GIFT_CARD

## Cost-at-Sale Gap
- **Product table**: NO buyPrice column
- **SaleItem table**: NO costAtSale column
- **Impact**: Cannot calculate historical gross profit
- **Action**: Show "Data biaya belum tersedia" state for Laba Kotor widget

## Tenant Isolation
- All tables have tenantId column
- All queries must filter by tenantId
- Branch filtering via outletId

## Branch Isolation
- UserOutlet table maps users to outlets
- OWNER sees all outlets in tenant
- MANAGER/STAFF sees only assigned outlets
