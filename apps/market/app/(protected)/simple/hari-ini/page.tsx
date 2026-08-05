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
    <div style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 1400 }}>
      {/* Row 1: KPI Cards */}
      <DashboardKpi data={dash} />

      {/* Row 2: Sales Trend (full width) */}
      <SalesTrend data={dash.salesTrend} />

      {/* Row 3: Action Center + Top Products (2-col) */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <ActionCenter alerts={dash.alerts} />
        <TopProducts products={dash.topProducts} />
      </div>

      {/* Row 4: Stock Health + Payment Breakdown + Cashier Activity (3-col) */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
        <StockHealth data={dash.stockHealth} />
        <PaymentBreakdown data={dash.paymentBreakdown} />
        <CashierActivity shifts={dash.cashierActivity} />
      </div>
    </div>
  );
}
