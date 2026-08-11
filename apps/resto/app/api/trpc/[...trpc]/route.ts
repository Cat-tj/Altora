import { NextRequest, NextResponse } from "next/server";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "../../../../lib/trpc";
import { auth } from "../../../../auth";

/**
 * tRPC API handler untuk Altora Resto.
 *
 * Endpoint: /api/trpc/[...trpc]
 *
 * Menyediakan akses ke:
 *   - /api/trpc/laporan.*    → Laporan & Analytics
 *   - /api/trpc/pengaturan.* → Pengaturan Tenant & Outlet
 *   - /api/trpc/notifikasi.* → Notifikasi In-App
 */
export async function GET(
  request: NextRequest,
) {
  return handleTrpcRequest(request);
}

export async function POST(
  request: NextRequest,
) {
  return handleTrpcRequest(request);
}

async function handleTrpcRequest(request: NextRequest) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 },
    );
  }

  const user = session.user as {
    id: string;
    tenantId: string;
    role: "OWNER" | "MANAGER" | "STAFF";
  };

  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req: request,
    router: appRouter,
    createContext: () => ({
      tenant: {
        tenantId: user.tenantId,
        userId: user.id,
        role: user.role,
      },
    }),
    onError({ error }) {
      console.error("[tRPC Error]", error.message);
    },
  });
}
