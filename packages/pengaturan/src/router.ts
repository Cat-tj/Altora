import { z } from "zod";
import { initTRPC } from "@trpc/server";
import type { TenantContext } from "@altora/db/tenant";
import {
  getRestoTenantSettings,
  updateRestoTenantSettings,
  getRestoOutlets,
  getRestoReceiptConfig,
} from "./resto-settings.js";

// ── tRPC Context ──────────────────────────────────────────

export type PengaturanContext = {
  tenant: TenantContext;
};

// ── tRPC Init ─────────────────────────────────────────────

const t = initTRPC.context<PengaturanContext>().create();

export const pengaturanRouter = t.router({
  /** Ambil pengaturan tenant */
  getSettings: t.procedure.query(async ({ ctx }) => {
    return getRestoTenantSettings(ctx.tenant.tenantId);
  }),

  /** Update pengaturan tenant (hanya OWNER/MANAGER) */
  updateSettings: t.procedure
    .input(
      z.object({
        receiptFooter: z.string().optional(),
        taxPercent: z.number().min(0).max(100).optional(),
        serviceChargePercent: z.number().min(0).max(100).optional(),
        staticQrisPayload: z.string().nullable().optional(),
        businessName: z.string().optional(),
        businessAddress: z.string().optional(),
        businessPhone: z.string().optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      if (ctx.tenant.role !== "OWNER" && ctx.tenant.role !== "MANAGER") {
        throw new Error("Hanya pemilik & manajer yang dapat mengubah pengaturan.");
      }
      await updateRestoTenantSettings(ctx.tenant.tenantId, input);
      return { success: true };
    }),

  /** Daftar outlet */
  getOutlets: t.procedure.query(async ({ ctx }) => {
    return getRestoOutlets(ctx.tenant.tenantId);
  }),

  /** Konfigurasi struk */
  getReceiptConfig: t.procedure.query(async ({ ctx }) => {
    return getRestoReceiptConfig(ctx.tenant.tenantId);
  }),
});

export type PengaturanRouter = typeof pengaturanRouter;
