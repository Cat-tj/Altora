import { db } from "./db";

export type TenantSettingRecord = {
  id: string;
  tenantId: string;
  receiptFooter: string | null;
  taxPercent: number;
  staticQrisPayload: string | null;
  pointsPerAmount: number;
};

export type OutletRecord = {
  id: string;
  tenantId: string;
  name: string;
  address: string | null;
  phone: string | null;
  isActive: boolean;
};

export type StaffRecord = {
  id: string;
  tenantId: string;
  name: string;
  email: string | null;
  phone: string | null;
  role: string;
  jobTitle: string | null;
  pin: string | null;
  isActive: boolean;
};

export async function getTenantSettings(tenantId: string): Promise<TenantSettingRecord | null> {
  const result = await db.query<{
    id: string;
    tenant_id: string;
    receipt_footer: string | null;
    tax_percent: number | null;
    static_qris_payload: string | null;
    points_per_amount: number | null;
  }>(
    `SELECT id, "tenantId" AS tenant_id, "receiptFooter" AS receipt_footer, "taxPercent" AS tax_percent, "staticQrisPayload" AS static_qris_payload, "pointsPerAmount" AS points_per_amount
       FROM "TenantSetting"
      WHERE "tenantId" = $1
      LIMIT 1`,
    [tenantId]
  );

  const row = result.rows[0];
  if (!row) return null;
  return {
    id: row.id,
    tenantId: row.tenant_id,
    receiptFooter: row.receipt_footer,
    taxPercent: Number(row.tax_percent || 0),
    staticQrisPayload: row.static_qris_payload,
    pointsPerAmount: Number(row.points_per_amount || 0),
  };
}

export async function listOutlets(tenantId: string): Promise<OutletRecord[]> {
  const result = await db.query<{
    id: string;
    tenant_id: string;
    name: string;
    address: string | null;
    phone: string | null;
    is_active: boolean;
  }>(
    `SELECT id, "tenantId" AS tenant_id, name, address, phone, "isActive" AS is_active
       FROM "Outlet"
      WHERE "tenantId" = $1
      ORDER BY name ASC`,
    [tenantId]
  );

  return result.rows.map((r) => ({
    id: r.id,
    tenantId: r.tenant_id,
    name: r.name,
    address: r.address,
    phone: r.phone,
    isActive: r.is_active,
  }));
}

export async function listStaff(tenantId: string): Promise<StaffRecord[]> {
  const result = await db.query<{
    id: string;
    tenant_id: string;
    name: string;
    email: string | null;
    phone: string | null;
    role: string;
    job_title: string | null;
    pin: string | null;
    is_active: boolean;
  }>(
    `SELECT id, "tenantId" AS tenant_id, name, email, phone, role, "jobTitle" AS job_title, pin, "isActive" AS is_active
       FROM "User"
      WHERE "tenantId" = $1
      ORDER BY name ASC`,
    [tenantId]
  );

  return result.rows.map((r) => ({
    id: r.id,
    tenantId: r.tenant_id,
    name: r.name,
    email: r.email,
    phone: r.phone,
    role: r.role,
    jobTitle: r.job_title,
    pin: r.pin,
    isActive: r.is_active,
  }));
}
