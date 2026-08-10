import { z } from "zod";
import { initTRPC } from "@trpc/server";
import type { TenantContext } from "@altora/db/tenant";
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  getUnreadCount,
  cleanupOldNotifications,
} from "./resto-notifications.js";

// ── tRPC Context ──────────────────────────────────────────

export type NotifikasiContext = {
  tenant: TenantContext;
};

// ── tRPC Init ─────────────────────────────────────────────

const t = initTRPC.context<NotifikasiContext>().create();

export const notifikasiRouter = t.router({
  /** Daftar notifikasi */
  list: t.procedure
    .input(
      z.object({
        unreadOnly: z.boolean().default(false),
        limit: z.number().min(1).max(100).default(50),
      }),
    )
    .query(async ({ input, ctx }) => {
      return getNotifications(ctx.tenant.tenantId, {
        unreadOnly: input.unreadOnly,
        limit: input.limit,
        userId: ctx.tenant.userId,
      });
    }),

  /** Jumlah notifikasi belum dibaca */
  unreadCount: t.procedure.query(async ({ ctx }) => {
    return getUnreadCount(ctx.tenant.tenantId, ctx.tenant.userId);
  }),

  /** Tandai sudah dibaca */
  markRead: t.procedure
    .input(
      z.object({
        notificationId: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      await markAsRead(ctx.tenant.tenantId, input.notificationId);
      return { success: true };
    }),

  /** Tandai semua sudah dibaca */
  markAllRead: t.procedure.mutation(async ({ ctx }) => {
    await markAllAsRead(ctx.tenant.tenantId, ctx.tenant.userId);
    return { success: true };
  }),

  /** Bersihkan notifikasi lama (hanya OWNER) */
  cleanup: t.procedure
    .input(
      z.object({
        olderThanDays: z.number().min(1).max(365).default(30),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      if (ctx.tenant.role !== "OWNER") {
        throw new Error("Hanya pemilik yang dapat membersihkan notifikasi.");
      }
      const deleted = await cleanupOldNotifications(
        ctx.tenant.tenantId,
        input.olderThanDays,
      );
      return { deleted };
    }),
});

export type NotifikasiRouter = typeof notifikasiRouter;
