import { redirect } from "next/navigation";
import { auth } from "../auth";
import { isRoleAllowed } from "./market-authz-policy.mjs";

export type MarketRole = "OWNER" | "MANAGER" | "STAFF";

export type MarketSessionUser = {
  id: string;
  name?: string | null;
  email?: string | null;
  tenantId: string;
  tenantName?: string;
  role: MarketRole;
};

export function isRoleAllowedFromPolicy(role: MarketRole | undefined, roles: MarketRole[]): boolean {
  return isRoleAllowed(role, roles);
}

export async function requireRole(roles: MarketRole[]): Promise<MarketSessionUser> {
  const session = await auth();
  const user = session?.user as MarketSessionUser | undefined;
  if (!user?.id || !user.role) redirect("/login");
  if (!isRoleAllowed(user.role, roles)) redirect("/simple/hari-ini");
  return user;
}
