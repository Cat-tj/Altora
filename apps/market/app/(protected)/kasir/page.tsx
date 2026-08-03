import { requireRole } from "../../../lib/market-authz";
import { getOpenMarketShift, listAccessibleMarketOutlets, listMarketPosProducts } from "../../../lib/market-pos";
import { OpenShiftForm } from "./open-shift-form";
import { MarketPosScreen } from "./pos-screen";

export default async function CashierPage() {
  const user = await requireRole(["OWNER", "MANAGER", "STAFF"]);
  const shift = await getOpenMarketShift({ tenantId: user.tenantId, userId: user.id });
  if (!shift) return <OpenShiftForm outlets={await listAccessibleMarketOutlets({ tenantId: user.tenantId, userId: user.id, role: user.role })} />;
  return <MarketPosScreen shift={shift} products={await listMarketPosProducts({ tenantId: user.tenantId, outletId: shift.outletId })} />;
}
