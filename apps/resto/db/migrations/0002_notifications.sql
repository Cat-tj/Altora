-- ============================================================
-- Altora Resto — Tabel Notifikasi In-App
--
-- Idempoten: aman dijalankan berulang kali.
-- ============================================================

DO $$ BEGIN
  CREATE TYPE "NotificationType" AS ENUM (
    'LOW_STOCK', 'OUT_OF_STOCK', 'NEW_ORDER', 'ORDER_READY',
    'ORDER_CANCELLED', 'TABLE_ASSIGNED', 'PAYMENT_RECEIVED',
    'SHIFT_OPENED', 'SHIFT_CLOSED'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "NotificationPriority" AS ENUM ('INFO', 'WARNING', 'URGENT');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS "Notification" (
  id          text PRIMARY KEY,
  "tenantId"  text NOT NULL REFERENCES "Tenant"(id) ON DELETE CASCADE,
  "userId"    text REFERENCES "User"(id) ON DELETE SET NULL,
  type        "NotificationType" NOT NULL,
  priority    "NotificationPriority" NOT NULL DEFAULT 'INFO',
  title       text NOT NULL,
  message     text NOT NULL,
  metadata    jsonb,
  "isRead"    boolean NOT NULL DEFAULT false,
  "createdAt" timestamptz NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "Notification_tenant_read_idx"
  ON "Notification" ("tenantId", "isRead", "createdAt" DESC);

CREATE INDEX IF NOT EXISTS "Notification_tenant_user_idx"
  ON "Notification" ("tenantId", "userId", "isRead");
