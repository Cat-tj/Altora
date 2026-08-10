import { db } from "@altora/db/pool";

// ── Types ──────────────────────────────────────────────────

export type NotificationType =
  | "LOW_STOCK"
  | "OUT_OF_STOCK"
  | "NEW_ORDER"
  | "ORDER_READY"
  | "ORDER_CANCELLED"
  | "TABLE_ASSIGNED"
  | "PAYMENT_RECEIVED"
  | "SHIFT_OPENED"
  | "SHIFT_CLOSED";

export type NotificationPriority = "INFO" | "WARNING" | "URGENT";

export type Notification = {
  id: string;
  tenantId: string;
  userId: string | null;
  type: NotificationType;
  priority: NotificationPriority;
  title: string;
  message: string;
  metadata: Record<string, unknown> | null;
  isRead: boolean;
  createdAt: string;
};

// ── CRUD Operations ────────────────────────────────────────

/**
 * Buat notifikasi baru.
 */
export async function createNotification(data: {
  tenantId: string;
  userId?: string;
  type: NotificationType;
  priority?: NotificationPriority;
  title: string;
  message: string;
  metadata?: Record<string, unknown>;
}): Promise<Notification> {
  const id = `notif-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  const result = await db.query<{
    id: string;
    tenant_id: string;
    user_id: string | null;
    type: string;
    priority: string;
    title: string;
    message: string;
    metadata: string | null;
    is_read: boolean;
    created_at: string;
  }>(
    `INSERT INTO "Notification"
       (id, "tenantId", "userId", type, priority, title, message, metadata, "isRead", "createdAt")
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, false, NOW())
     RETURNING
       id,
       "tenantId" AS tenant_id,
       "userId" AS user_id,
       type,
       priority,
       title,
       message,
       metadata::text AS metadata,
       "isRead" AS is_read,
       "createdAt"::text AS created_at`,
    [
      id,
      data.tenantId,
      data.userId ?? null,
      data.type,
      data.priority ?? "INFO",
      data.title,
      data.message,
      data.metadata ? JSON.stringify(data.metadata) : null,
    ],
  );

  const row = result.rows[0]!;
  return {
    id: row.id,
    tenantId: row.tenant_id,
    userId: row.user_id,
    type: row.type as NotificationType,
    priority: row.priority as NotificationPriority,
    title: row.title,
    message: row.message,
    metadata: row.metadata ? JSON.parse(row.metadata) : null,
    isRead: row.is_read,
    createdAt: row.created_at,
  };
}

/**
 * Ambil notifikasi tenant (terbaru dulu).
 */
export async function getNotifications(
  tenantId: string,
  options?: { unreadOnly?: boolean; limit?: number; userId?: string },
): Promise<Notification[]> {
  const limit = options?.limit ?? 50;
  const conditions: string[] = [`"tenantId" = $1`];
  const params: unknown[] = [tenantId];
  let idx = 1;

  if (options?.unreadOnly) {
    conditions.push(`"isRead" = false`);
  }
  if (options?.userId) {
    conditions.push(`("userId" IS NULL OR "userId" = $${++idx})`);
    params.push(options.userId);
  }

  params.push(limit);

  const result = await db.query<{
    id: string;
    tenant_id: string;
    user_id: string | null;
    type: string;
    priority: string;
    title: string;
    message: string;
    metadata: string | null;
    is_read: boolean;
    created_at: string;
  }>(
    `SELECT
       id,
       "tenantId" AS tenant_id,
       "userId" AS user_id,
       type,
       priority,
       title,
       message,
       metadata::text AS metadata,
       "isRead" AS is_read,
       "createdAt"::text AS created_at
     FROM "Notification"
     WHERE ${conditions.join(" AND ")}
     ORDER BY "createdAt" DESC
     LIMIT $${idx + 1}`,
    params,
  );

  return result.rows.map((r) => ({
    id: r.id,
    tenantId: r.tenant_id,
    userId: r.user_id,
    type: r.type as NotificationType,
    priority: r.priority as NotificationPriority,
    title: r.title,
    message: r.message,
    metadata: r.metadata ? JSON.parse(r.metadata) : null,
    isRead: r.is_read,
    createdAt: r.created_at,
  }));
}

/**
 * Tandai notifikasi sebagai sudah dibaca.
 */
export async function markAsRead(
  tenantId: string,
  notificationId: string,
): Promise<void> {
  await db.query(
    `UPDATE "Notification"
     SET "isRead" = true
     WHERE id = $1 AND "tenantId" = $2`,
    [notificationId, tenantId],
  );
}

/**
 * Tandai semua notifikasi tenant sebagai sudah dibaca.
 */
export async function markAllAsRead(
  tenantId: string,
  userId?: string,
): Promise<void> {
  const conditions = [`"tenantId" = $1`, `"isRead" = false`];
  const params: unknown[] = [tenantId];

  if (userId) {
    conditions.push(`("userId" IS NULL OR "userId" = $2)`);
    params.push(userId);
  }

  await db.query(
    `UPDATE "Notification"
     SET "isRead" = true
     WHERE ${conditions.join(" AND ")}`,
    params,
  );
}

/**
 * Hitung jumlah notifikasi belum dibaca.
 */
export async function getUnreadCount(
  tenantId: string,
  userId?: string,
): Promise<number> {
  const conditions = [`"tenantId" = $1`, `"isRead" = false`];
  const params: unknown[] = [tenantId];

  if (userId) {
    conditions.push(`("userId" IS NULL OR "userId" = $2)`);
    params.push(userId);
  }

  const result = await db.query<{ count: string }>(
    `SELECT COUNT(*)::text AS count
     FROM "Notification"
     WHERE ${conditions.join(" AND ")}`,
    params,
  );

  return Number(result.rows[0]?.count ?? 0);
}

/**
 * Hapus notifikasi yang sudah dibaca lebih dari N hari.
 */
export async function cleanupOldNotifications(
  tenantId: string,
  olderThanDays: number = 30,
): Promise<number> {
  const result = await db.query<{ count: string }>(
    `DELETE FROM "Notification"
     WHERE "tenantId" = $1
       AND "isRead" = true
       AND "createdAt" < NOW() - INTERVAL '1 day' * $2
     RETURNING id`,
    [tenantId, olderThanDays],
  );

  return result.rowCount ?? 0;
}
