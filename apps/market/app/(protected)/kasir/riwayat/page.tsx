import { auth } from "../../../../auth";
import { listMarketSales } from "../../../../lib/market-pos";
import { SalesHistory } from "../sales-history";

export default async function SalesHistoryPage() {
  const user = (await auth())!.user as { id: string; tenantId: string; role: "OWNER" | "MANAGER" | "STAFF" };
  const sales = await listMarketSales({ tenantId: user.tenantId, userId: user.id, role: user.role });
  return <SalesHistory sales={sales} canVoid={user.role !== "STAFF"} />;
}
