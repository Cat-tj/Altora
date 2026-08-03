import { redirect } from "next/navigation";
import { auth } from "../../auth";
import { RestoShell } from "../resto-shell";

type AuthenticatedRestoUser = {
  id?: string;
  name?: string | null;
  tenantName?: string;
  role?: "OWNER" | "MANAGER" | "STAFF";
};

export default async function ProtectedLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const session = await auth();
  const user = session?.user as AuthenticatedRestoUser | undefined;
  if (!user?.id || !user.role) redirect("/login");
  return <RestoShell role={user.role} tenantName={user.tenantName ?? "Restoran Saya"} userName={user.name ?? "Pengguna Resto"}>{children}</RestoShell>;
}
