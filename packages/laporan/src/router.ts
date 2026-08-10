import { z } from "zod";
import { initTRPC, TRPCError } from "@trpc/server";
import type { TenantContext } from "@altora/db/tenant";
import {
  getDailySummary,
  getSalesByPeriod,
  getProfitMargin,
  getBestSellers,
  getRestoSalesReport,
} from "./resto-reports.js";

// ── tRPC Context ──────────────────────────────────────────

export type LaporanContext = {
  tenant: TenantContext;
};

// ── tRPC Init ─────────────────────────────────────────────

const t = initTRPC.context<LaporanContext>().create({
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

export const laporanRouter = t.router({
  /** Ringkasan penjualan harian */
  dailySummary: t.procedure
    .input(
      z.object({
        date: z.string().optional(),
      }),
    )
    .query(async ({ input, ctx }) => {
      return getDailySummary(ctx.tenant.tenantId, input.date);
    }),

  /** Penjualan per periode (N hari terakhir) */
  salesByPeriod: t.procedure
    .input(
      z.object({
        days: z.number().min(1).max(90).default(7),
      }),
    )
    .query(async ({ input, ctx }) => {
      return getSalesByPeriod(ctx.tenant.tenantId, input.days);
    }),

  /** Margin keuntungan */
  profitMargin: t.procedure
    .input(
      z.object({
        date: z.string().optional(),
      }),
    )
    .query(async ({ input, ctx }) => {
      return getProfitMargin(ctx.tenant.tenantId, input.date);
    }),

  /** Menu terlaris */
  bestSellers: t.procedure
    .input(
      z.object({
        days: z.number().min(1).max(365).default(30),
        limit: z.number().min(1).max(50).default(10),
      }),
    )
    .query(async ({ input, ctx }) => {
      return getBestSellers(
        ctx.tenant.tenantId,
        input.days,
        input.limit,
      );
    }),

  /** Laporan lengkap */
  salesReport: t.procedure
    .input(
      z.object({
        date: z.string().optional(),
        periodDays: z.number().min(1).max(90).default(7),
      }),
    )
    .query(async ({ input, ctx }) => {
      return getRestoSalesReport(
        ctx.tenant.tenantId,
        input.date,
        input.periodDays,
      );
    }),
});

export type LaporanRouter = typeof laporanRouter;
