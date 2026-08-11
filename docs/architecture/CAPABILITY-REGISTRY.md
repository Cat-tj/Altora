# ALTORA CAPABILITY REGISTRY

## 1. Overview

The **Capability Registry** defines the official taxonomy of all capabilities within the Altora SaaS ERP Platform.
Every capability has an explicit package owner, persistence owner, status, and migration strategy.

---

## 2. Capabilities Matrix

| Capability | Current Owner | Target Owner | Consumers | Vertical Specific? | Persistence Owner | Status | Migration Required? | Tests | Known Duplication |
|---|---|---|---|---|---|---|---|---|---|
| **Control Plane Auth & Identity** | `apps/market/lib/market-authz` | `@altora/control-plane-core` | Market, Resto, Service, Admin | No | Control DB (`Tenant`, `User`, `Outlet`) | Legacy / Scattered | Yes | Basic | Duplicated auth helpers in Resto |
| **App Shell & Nav** | `packages/ui` / `apps/market` | `@altora/ui` (AppShell) | Market, Resto, Service, Admin | No | Control DB | Partial | Yes | Visual | Separate RestoNav and MarketNav |
| **POS Cart & Money** | `packages/pos-core` | `@altora/pos-core` | market-pos, resto-pos, service-pos | No | N/A (In-Memory / State) | Structured | Minor | Contract | Cart math duplicated in page components |
| **POS UI (Shell, Grid, Payment)** | `apps/market/app/(protected)/kasir` | `@altora/pos-ui` | Market, Resto, Service | No | N/A | Scattered | Yes | E2E | Market POS & Resto POS UI separate |
| **Market POS Adapter** | `packages/market-pos` | `@altora/market-pos` | Market App | Yes (Retail) | Market DB | Active | Refactor | Contract | Barcode & SKU logic in page.tsx |
| **Resto POS Adapter** | `packages/resto-pos` | `@altora/resto-pos` | Resto App | Yes (F&B) | Resto DB | Active | Refactor | Contract | Table & kitchen logic mixed with cart |
| **Service POS Adapter** | None (New) | `@altora/service-pos` | Service App | Yes (Service) | Service DB | Missing | Create | Required | None |
| **Camera Barcode Scanner** | `apps/market/app/(protected)/kasir/camera-barcode-modal.tsx` | `@altora/pos-ui` (ScannerDialog) | Market, Service | No | N/A | Active | Yes | Manual | Tied to Market Kasir directory |
| **Payment Core & QRIS** | `apps/market/lib/qris.ts` | `@altora/payment-core` | Market, Resto, Service | No | Control/Operational DB | Scattered | Yes | Unit | QRIS parser copied in Resto |
| **Inventory Core & Stock Movements** | `apps/market/lib/market-stock-ledger.ts` | `@altora/inventory-core` | Market, Resto, Service | No | Operational DBs | Monolithic | Yes | Integration | Direct balance updates without log |
| **Inventory UI** | `apps/market/app/(protected)/stok` | `@altora/inventory-ui` | Market, Resto, Service | No | N/A | App-bound | Yes | Visual | Page-bound stock tables |
| **Receiving / Stock Opname / Transfer** | `apps/market/app/(protected)/penerimaan`, `/opname`, `/transfer` | `@altora/inventory-core` + `@altora/inventory-ui` | Market, Resto, Service | No | Operational DBs | Partial | Yes | Integration | Separate forms in Market & Resto |
| **Customer & Member Management** | `apps/market/app/(protected)/pelanggan` | `@altora/customer-core` + UI | Market, Resto, Service | No | Operational / Shared DB | App-bound | Yes | Unit | Duplicate customer forms |
| **Loyalty & Point Ledger** | `apps/market/lib/loyalty` | `@altora/customer-core` | Market, Resto, Service | No | Operational DB | Basic | Yes | Unit | Mutable point counts |
| **Promotion Engine** | `apps/market/lib/promo.ts` | `@altora/promo-core` | Market, Resto, Service | No | Shared DB | Basic | Yes | Unit | Discount logic in cashier page |
| **Voucher & Gift Card** | `apps/market/app/(protected)/voucher` | `@altora/promo-core` | Market, Resto, Service | No | Shared DB | Basic | Yes | Unit | App-bound |
| **Supplier & Procurement** | `apps/market/app/(protected)/pemasok` | `@altora/supplier-core` | Market, Resto, Service | No | Operational DB | Basic | Yes | Unit | App-bound |
| **Reporting & Analytics** | `packages/laporan` | `@altora/reporting-core` | Market, Resto, Service, Admin | No | Operational DBs | Partial | Yes | Unit | Synchronous heavy queries |
| **Audit Logging** | `apps/market/app/(protected)/audit-log` | `@altora/audit-core` | Market, Resto, Service, Admin | No | Control / Operational DB | Basic | Yes | Integration | App-bound audit table |
| **Permissions & RBAC** | `apps/market/lib/market-authz` | `@altora/permissions-core` | All Apps | No | Control DB | Hardcoded | Yes | Unit | Hardcoded `role === 'OWNER'` checks |
| **Notifications & Webhooks** | `packages/notifikasi` | `@altora/notifications-core` | All Apps | No | Control DB | Partial | Refactor | Unit | Vendor coupled |
| **Finance & COGS** | `apps/market/app/(protected)/keuangan` | `@altora/finance-core` | Market, Resto, Service | No | Operational DB | Basic | Yes | Unit | Simple net sales - expenses formula |

---

## 3. Decision Tree for New Capabilities

Before adding any capability, the agent MUST execute the following decision sequence:

```
                  Is there an existing package for this capability?
                                 /                \
                               YES                 NO
                              /                      \
      Can it be reused with config/props?      Is it generic across 2+ verticals?
                /            \                        /              \
              YES             NO                    YES               NO
             /                 \                    /                  \
       [1. REUSE]       Can contract be       Create package      Keep inside vertical
                          extended?         @altora/<domain>      package (e.g. resto-pos)
                          /       \          [4. EXTEND]             [5. ADAPT]
                        YES        NO
                        /            \
                  [2. CONFIGURE]   [3. COMPOSE]
```
