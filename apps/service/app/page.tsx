import { headers } from "next/headers";
import { ServicePosClient } from "./service-pos-client";
import { listServiceCatalog, listServiceStaff } from "../lib/service-db";
import { resolveServiceContext } from "../lib/service-auth";

export default async function ServicePage() {
  const headerStore = await headers();
  // Construct dummy Request object from Next.js server headers
  const reqHeaders = new Headers();
  headerStore.forEach((value, key) => reqHeaders.set(key, value));
  const req = new Request("http://localhost:3017", { headers: reqHeaders });

  const { ctx } = resolveServiceContext(req);

  const serviceCtx = {
    tenantId: ctx.tenantId,
    userId: ctx.userId,
    outletId: ctx.activeOutletId,
  };

  const [catalog, staff] = await Promise.all([
    listServiceCatalog(serviceCtx),
    listServiceStaff(serviceCtx),
  ]);

  return <ServicePosClient catalog={catalog} staff={staff} />;
}
