import { db } from "./db";

export type AuditLogRecord = {
  id: string;
  tenantId: string;
  action: string;
  description: string;
  userName?: string;
  createdAt: string;
};

export async function listAuditLogs(tenantId: string): Promise<AuditLogRecord[]> {
  const result = await db.query<{
    id: string;
    tenant_id: string;
    action: string;
    description: string;
    user_name: string;
    created_at: Date;
  }>(
    `SELECT a.id,
            a."tenantId" AS tenant_id,
            a.action,
            a.description,
            u.name AS user_name,
            a."createdAt" AS created_at
       FROM "AuditLog" a
       JOIN "User" u ON u.id = a."userId"
      WHERE a."tenantId" = $1
      ORDER BY a."createdAt" DESC`,
    [tenantId]
  );

  return result.rows.map((row) => ({
    id: row.id,
    tenantId: row.tenant_id,
    action: row.action,
    description: row.description,
    userName: row.user_name,
    createdAt: row.created_at.toISOString(),
  }));
}
