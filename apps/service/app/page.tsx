import { headers } from "next/headers";
import { ServicePosClient } from "./service-pos-client";
import { listServiceCatalog, listServiceStaff } from "../lib/service-db";

export default async function ServicePage() {
  const headerStore = await headers();
  const tenantId = headerStore.get("x-altora-tenant-id") ?? "seed_tenant_market";
  const userId = headerStore.get("x-altora-user-id") ?? "service-local-user";
  const [catalog, staff] = await Promise.all([
    listServiceCatalog({ tenantId, userId }),
    listServiceStaff({ tenantId, userId }),
  ]);
  return <ServicePosClient catalog={catalog} staff={staff} />;
}
