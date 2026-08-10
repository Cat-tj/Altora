import { z } from "zod";
import { initTRPC } from "@trpc/server";
import { laporanRouter } from "@altora/laporan/router";
import { pengaturanRouter } from "@altora/pengaturan/router";
import { notifikasiRouter } from "@altora/notifikasi/router";
import type { TenantContext } from "@altora/db/tenant";

// ── Root Context ──────────────────────────────────────────

export type AppContext = {
  tenant: TenantContext;
};

const t = initTRPC.context<AppContext>().create({
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof z.ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

/**
 * Router gabungan untuk Altora Resto.
 * Menggabungkan laporan, pengaturan, dan notifikasi.
 */
export const appRouter = t.router({
  laporan: laporanRouter,
  pengaturan: pengaturanRouter,
  notifikasi: notifikasiRouter,
});

export type AppRouter = typeof appRouter;
