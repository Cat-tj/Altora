import { requireRole } from "../../../lib/market-authz";
import { getOpenMarketShift, listAccessibleMarketOutlets, listMarketPosProducts } from "../../../lib/market-pos";
import { listMarketMembers } from "../../../lib/market-members";
import { listMarketPromos } from "../../../lib/market-promos";
import { getTenantSettings } from "../../../lib/market-settings";
import { OpenShiftForm } from "./open-shift-form";
import { MarketPosScreen } from "./pos-screen";

export default async function CashierPage() {
  const user = await requireRole(["OWNER", "MANAGER", "STAFF"]);
  const shift = await getOpenMarketShift({ tenantId: user.tenantId, userId: user.id });
  if (!shift) return <OpenShiftForm outlets={await listAccessibleMarketOutlets({ tenantId: user.tenantId, userId: user.id, role: user.role })} />;
  
  const settings = await getTenantSettings(user.tenantId);

  return (
    <MarketPosScreen
      shift={shift}
      products={await listMarketPosProducts({ tenantId: user.tenantId, outletId: shift.outletId })}
      members={await listMarketMembers(user.tenantId)}
      promos={await listMarketPromos(user.tenantId)}
      expireDiscountSettings={{
        enabled: settings?.expireDiscountEnabled ?? false,
        mode: settings?.expireDiscountMode ?? "manual",
        days: settings?.expireDiscountDays ?? 30,
        percent: settings?.expireDiscountPercent ?? 20,
      }}
    />
  );
}
