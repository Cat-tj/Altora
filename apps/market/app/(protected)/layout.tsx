import { redirect } from "next/navigation";
import { auth } from "../../auth";
import { MarketShell } from "../market-shell";

type AuthenticatedMarketUser = {
  id?: string;
  name?: string | null;
  tenantName?: string;
  role?: "OWNER" | "MANAGER" | "STAFF";
};

export default async function ProtectedLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const session = await auth();
  const user = session?.user as AuthenticatedMarketUser | undefined;
  if (!user?.id || !user.role) redirect("/login");
  return <MarketShell role={user.role} tenantName={user.tenantName ?? "Toko Saya"} userName={user.name ?? "Pengguna Market"}>{children}</MarketShell>;
}
