import Link from "next/link";
import { auth } from "../../../../auth";
import { getMarketDashboard } from "../../../../lib/market-dashboard";
import { DashboardKpi } from "./_components/dashboard-kpi";
import { SalesTrend } from "./_components/sales-trend";
import { ActionCenter } from "./_components/action-center";
import { TopProducts } from "./_components/top-products";
import { StockHealth } from "./_components/stock-health";
import { PaymentBreakdown } from "./_components/payment-breakdown";
import { CashierActivity } from "./_components/cashier-activity";

export default async function MarketHomePage() {
  const session = await auth();
  const user = session!.user as { id: string; tenantId: string; role: "OWNER" | "MANAGER" | "STAFF" };
  const dash = await getMarketDashboard({ tenantId: user.tenantId, userId: user.id, role: user.role });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {/* Page header — dashboard only */}
      <div className="market-page-header" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10, marginBottom: 2 }}>
        <div>
          <p style={{ fontSize: "0.7rem", color: "#6b7280", margin: 0 }}>Beranda toko</p>
          <h1 style={{ fontSize: "1.35rem", fontWeight: 800, margin: "2px 0 0", letterSpacing: "-0.02em" }}>Operasional hari ini</h1>
        </div>
        <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
          <Link href="/kasir" style={{ display: "inline-flex", alignItems: "center", height: 36, padding: "0 14px", borderRadius: 8, background: "#0f1b3d", color: "#fff", fontWeight: 700, fontSize: "0.78rem", textDecoration: "none" }}>Buka Kasir</Link>
          <Link href="/produk" style={{ display: "inline-flex", alignItems: "center", height: 36, padding: "0 14px", borderRadius: 8, border: "1px solid #0f1b3d", color: "#0f1b3d", fontWeight: 700, fontSize: "0.78rem", textDecoration: "none" }}>Lihat Produk</Link>
        </div>
      </div>

      {/* KPI Cards */}
      <DashboardKpi data={dash} />

      {/* Sales Trend (full width) */}
      <SalesTrend data={dash.salesTrend} />

      {/* Action Center + Top Products (2-col) */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <ActionCenter alerts={dash.alerts} />
        <TopProducts products={dash.topProducts} />
      </div>

      {/* Stock Health + Payment Breakdown + Cashier Activity (3-col) */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
        <StockHealth data={dash.stockHealth} />
        <PaymentBreakdown data={dash.paymentBreakdown} />
        <CashierActivity shifts={dash.cashierActivity} />
      </div>
    </div>
  );
}
