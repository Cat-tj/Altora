import { db } from "./db";

export type RestoRole = "OWNER" | "MANAGER" | "STAFF";

export type RestoUser = {
  id: string;
  tenantId: string;
  tenantName: string;
  name: string;
  email: string;
  role: RestoRole;
};

export async function findRestoUserByEmail(email: string): Promise<(RestoUser & { passwordHash: string; tenantActive: boolean; userActive: boolean }) | null> {
  const result = await db.query<{
    id: string;
    tenant_id: string;
    tenant_name: string;
    name: string;
    email: string;
    role: RestoRole;
    password_hash: string;
    tenant_active: boolean;
    user_active: boolean;
  }>(
    `SELECT u.id,
            u."tenantId" AS tenant_id,
            t.name AS tenant_name,
            u.name,
            u.email,
            u.role,
            u."passwordHash" AS password_hash,
            t."isActive" AS tenant_active,
            u."isActive" AS user_active
       FROM "User" u
       INNER JOIN "Tenant" t ON t.id = u."tenantId"
      WHERE LOWER(u.email) = LOWER($1)
      LIMIT 1`,
    [email],
  );
  const row = result.rows[0];
  if (!row) return null;
  return {
    id: row.id,
    tenantId: row.tenant_id,
    tenantName: row.tenant_name,
    name: row.name,
    email: row.email,
    role: row.role,
    passwordHash: row.password_hash,
    tenantActive: row.tenant_active,
    userActive: row.user_active,
  };
}
