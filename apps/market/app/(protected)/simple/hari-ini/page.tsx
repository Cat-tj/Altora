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
    <div className="market-dashboard">
      {/* Page header — dashboard only */}
      <div className="market-page-header">
        <div>
          <p className="market-page-eyebrow">Beranda toko</p>
          <h1 className="market-page-title">Operasional hari ini</h1>
        </div>
        <div className="market-page-actions">
          <Link href="/kasir" className="market-btn-primary">Buka Kasir</Link>
          <Link href="/produk" className="market-btn-secondary">Lihat Produk</Link>
        </div>
      </div>

      {/* KPI Cards */}
      <DashboardKpi data={dash} />

      {/* Sales Trend (full width) */}
      <SalesTrend data={dash.salesTrend} />

      {/* Action Center + Top Products (2-col) */}
      <div className="market-two-col">
        <ActionCenter alerts={dash.alerts} />
        <TopProducts products={dash.topProducts} />
      </div>

      {/* Stock Health + Payment Breakdown + Cashier Activity (3→1 col) */}
      <div className="market-three-col">
        <StockHealth data={dash.stockHealth} />
        <PaymentBreakdown data={dash.paymentBreakdown} />
        <CashierActivity shifts={dash.cashierActivity} />
      </div>
    </div>
  );
}
