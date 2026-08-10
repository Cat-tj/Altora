import { headers } from "next/headers";
import { ServicePosClient } from "./service-pos-client";
import { listServiceCatalog, listServiceStaff } from "../lib/service-db";
import {
  resolveServiceContext,
  ServiceAuthError,
} from "../lib/service-auth";

export default async function ServicePosPage() {
  const reqHeaders = await headers();
  const dummyReq = new Request("http://localhost/service", {
    headers: reqHeaders,
  });

  let ctx;
  try {
    const res = await resolveServiceContext(dummyReq);
    ctx = res.ctx;
  } catch (err) {
    if (err instanceof ServiceAuthError && err.statusCode === 401) {
      return (
        <div className="flex h-screen flex-col items-center justify-center bg-slate-900 text-white">
          <h1 className="text-2xl font-bold">401 Unauthenticated</h1>
          <p className="mt-2 text-slate-400">
            Silakan login terlebih dahulu untuk mengakses Altora Service.
          </p>
        </div>
      );
    }
    if (err instanceof ServiceAuthError && err.statusCode === 403) {
      return (
        <div className="flex h-screen flex-col items-center justify-center bg-slate-900 text-white">
          <h1 className="text-2xl font-bold">403 Access Denied</h1>
          <p className="mt-2 text-slate-400">{err.message}</p>
        </div>
      );
    }
    throw err;
  }

  const catalog = await listServiceCatalog(ctx.tenantId);
  const staff = await listServiceStaff(ctx.tenantId);

  return <ServicePosClient catalog={catalog} staff={staff} />;
}
