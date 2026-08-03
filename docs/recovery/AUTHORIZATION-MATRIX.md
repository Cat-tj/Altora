Workflow Status: AWAITING_APPROVAL
Audit Verdict: REVISE
Implementation Approval: DENIED

# AUTHORIZATION MATRIX — ALTORA SUITE

## 1. System Roles Definition

| Role Key | Role Title | Description & System Scope |
| :--- | :--- | :--- |
| `SUPERADMIN` | Platform Owner | Global platform manager. Access to all tenants, billing, subscriptions, and system audit logs. Isolated auth session (`src/lib/super-admin-session.ts`). |
| `OWNER` | Tenant Business Owner | Full access to all business features, financial reports, settings, staff management, and audit logs within their tenant (`tenantId`). |
| `MANAGER` | Outlet Manager | Scoped access to assigned outlets (`outletId`). Manage inventory, stock opname, expenses, promotions, and daily POS operations. |
| `STAFF` | Cashier / Operator | Scoped access to assigned POS, attendance clock in/out, customer member creation, and basic order processing. |

---

## 2. Server-Side Route & Action Authorization Matrix

| Route / Action Domain | Path / Endpoint | Allowed Roles | Evidence / File Path | Required Enforcement Guard |
| :--- | :--- | :--- | :--- | :--- |
| **SuperAdmin Portal** | `/superadmin/*` | `SUPERADMIN` | `apps/admin/app/page.tsx` | `assertSuperAdminSession()` |
| **Audit Log** | `/audit-log`, `/pengaturan/audit-log` | `OWNER` | `apps/market/app/(protected)/audit-log/page.tsx` | `assertRole(["OWNER"])` |
| **Business & Store Settings** | `/pengaturan/bisnis`, `/pengaturan/modul` | `OWNER` | `apps/market/app/(protected)/pengaturan/page.tsx` | `assertRole(["OWNER"])` |
| **Staff & User Management** | `/pengaturan/karyawan` | `OWNER` | `apps/market/app/(protected)/pengaturan/page.tsx` | `assertRole(["OWNER"])` |
| **Outlet Management** | `/pengaturan/outlet` | `OWNER` | `apps/market/app/(protected)/pengaturan/page.tsx` | `assertRole(["OWNER"])` |
| **Financial Reports** | `/laporan`, `/finance/*` | `OWNER`, `MANAGER` | `apps/market/app/(protected)/laporan/page.tsx` | `assertRole(["OWNER", "MANAGER"])` |
| **Expenses & Cash Out** | `/pengeluaran`, `/kasir/cash-out` | `OWNER`, `MANAGER` | `apps/market/app/(protected)/pengeluaran/page.tsx` | `assertRole(["OWNER", "MANAGER"])` + `outletId` |
| **Products & Pricing** | `/produk/*` | `OWNER`, `MANAGER` | `apps/market/app/(protected)/produk/page.tsx` | `assertRole(["OWNER", "MANAGER"])` |
| **Stock Opname & Adjustments** | `/opname`, `/stock-count/*` | `OWNER`, `MANAGER` | `apps/market/app/(protected)/opname/page.tsx` | `assertRole(["OWNER", "MANAGER"])` + `outletId` |
| **Purchase Order & Goods Receipt** | `/penerimaan`, `/purchase-order` | `OWNER`, `MANAGER` | `apps/market/app/(protected)/penerimaan/page.tsx` | `assertRole(["OWNER", "MANAGER"])` + `outletId` |
| **Promos & Vouchers** | `/promo`, `/voucher` | `OWNER`, `MANAGER` | `apps/market/app/(protected)/promo/page.tsx` | `assertRole(["OWNER", "MANAGER"])` |
| **POS & Checkout** | `/kasir`, `/kasir/riwayat` | `OWNER`, `MANAGER`, `STAFF` | `apps/market/app/(protected)/kasir/page.tsx` | `assertRole(["OWNER", "MANAGER", "STAFF"])` + `outletId` |
| **Void Sale & Payment Correction** | `/kasir/riwayat` (Void / Correct) | `OWNER`, `MANAGER` | `apps/market/app/(protected)/kasir/riwayat/page.tsx` | `assertRole(["OWNER", "MANAGER"])` + `outletId` |
| **Member Creation & RFID Link** | `/member`, `/kasir` (Add Member) | `OWNER`, `MANAGER`, `STAFF` | `apps/market/app/(protected)/member/page.tsx` | `assertRole(["OWNER", "MANAGER", "STAFF"])` |
| **Staff Attendance** | `/absensi` | `OWNER`, `MANAGER`, `STAFF` | `apps/market/app/(protected)/absensi/page.tsx` | Self clock-in; list scoped to `outletId` |

---

## 3. Separation of Access Control Principles

### 3.1 Multi-Tenant Isolation
* **Principle:** Every database query MUST extract `tenantId` from `session.user.tenantId` on the server (`auth()` session context).
* **Rule:** `tenantId` is NEVER trusted from client parameters without server session validation.

### 3.2 Outlet Scoping
* **Principle:** Staff and Managers are bound to specific `UserOutlet` records.
* **Rule:** Queries for operational data (`ProductStock`, `CashierShift`, `Sale`, `StockCount`) MUST include `AND "outletId" IN (userOutlets)`.

### 3.3 Role Authorization
* **Principle:** Hiding navigation UI links is NOT authorization.
* **Rule:** Page server components and server actions MUST invoke `assertRole(allowedRoles)` on every execution.
