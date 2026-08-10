import { db } from "@altora/db/pool";

// ── Types ──────────────────────────────────────────────────

export type RestoTenantSetting = {
  id: string;
  tenantId: string;
  receiptFooter: string | null;
  taxPercent: number;
  serviceChargePercent: number;
  staticQrisPayload: string | null;
  pointsPerAmount: number;
  businessName: string | null;
  businessAddress: string | null;
  businessPhone: string | null;
};

export type RestoOutlet = {
  id: string;
  tenantId: string;
  name: string;
  address: string | null;
  phone: string | null;
  isActive: boolean;
};

export type RestoReceiptConfig = {
  tenantId: string;
  businessName: string;
  businessAddress: string | null;
  businessPhone: string | null;
  taxPercent: number;
  serviceChargePercent: number;
  footerMessage: string | null;
  staticQrisPayload: string | null;
};

// ── Settings Queries ───────────────────────────────────────

/**
 * Ambil pengaturan tenant untuk resto.
 */
export async function getRestoTenantSettings(
  tenantId: string,
): Promise<RestoTenantSetting | null> {
  const result = await db.query<{
    id: string;
    tenant_id: string;
    receipt_footer: string | null;
    tax_percent: number | null;
    service_charge_percent: number | null;
    static_qris_payload: string | null;
    points_per_amount: number | null;
    business_name: string | null;
    business_address: string | null;
    business_phone: string | null;
  }>(
    `SELECT
       id,
       "tenantId" AS tenant_id,
       "receiptFooter" AS receipt_footer,
       "taxPercent" AS tax_percent,
       COALESCE("serviceChargePercent", 0) AS service_charge_percent,
       "staticQrisPayload" AS static_qris_payload,
       COALESCE("pointsPerAmount", 0) AS points_per_amount,
       "businessName" AS business_name,
       "businessAddress" AS business_address,
       "businessPhone" AS business_phone
     FROM "TenantSetting"
     WHERE "tenantId" = $1
     LIMIT 1`,
    [tenantId],
  );

  const row = result.rows[0];
  if (!row) return null;

  return {
    id: row.id,
    tenantId: row.tenant_id,
    receiptFooter: row.receipt_footer,
    taxPercent: Number(row.tax_percent ?? 0),
    serviceChargePercent: Number(row.service_charge_percent ?? 0),
    staticQrisPayload: row.static_qris_payload,
    pointsPerAmount: Number(row.points_per_amount ?? 0),
    businessName: row.business_name,
    businessAddress: row.business_address,
    businessPhone: row.business_phone,
  };
}

/**
 * Update pengaturan tenant resto.
 */
export async function updateRestoTenantSettings(
  tenantId: string,
  data: {
    receiptFooter?: string;
    taxPercent?: number;
    serviceChargePercent?: number;
    staticQrisPayload?: string | null;
    businessName?: string;
    businessAddress?: string;
    businessPhone?: string;
  },
): Promise<void> {
  // Upsert: jika belum ada, buat baru
  const existing = await getRestoTenantSettings(tenantId);

  if (existing) {
    const sets: string[] = [];
    const params: unknown[] = [];
    let idx = 1;

    if (data.receiptFooter !== undefined) {
      sets.push(`"receiptFooter" = $${++idx}`);
      params.push(data.receiptFooter);
    }
    if (data.taxPercent !== undefined) {
      sets.push(`"taxPercent" = $${++idx}`);
      params.push(data.taxPercent);
    }
    if (data.serviceChargePercent !== undefined) {
      sets.push(`"serviceChargePercent" = $${++idx}`);
      params.push(data.serviceChargePercent);
    }
    if (data.staticQrisPayload !== undefined) {
      sets.push(`"staticQrisPayload" = $${++idx}`);
      params.push(data.staticQrisPayload);
    }
    if (data.businessName !== undefined) {
      sets.push(`"businessName" = $${++idx}`);
      params.push(data.businessName);
    }
    if (data.businessAddress !== undefined) {
      sets.push(`"businessAddress" = $${++idx}`);
      params.push(data.businessAddress);
    }
    if (data.businessPhone !== undefined) {
      sets.push(`"businessPhone" = $${++idx}`);
      params.push(data.businessPhone);
    }

    if (sets.length > 0) {
      sets.push('"updatedAt" = NOW()');
      await db.query(
        `UPDATE "TenantSetting" SET ${sets.join(", ")} WHERE "tenantId" = $1`,
        [tenantId, ...params],
      );
    }
  } else {
    await db.query(
      `INSERT INTO "TenantSetting"
         ("tenantId", "taxPercent", "receiptFooter", "serviceChargePercent",
          "businessName", "businessAddress", "businessPhone", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())`,
      [
        tenantId,
        data.taxPercent ?? 0,
        data.receiptFooter ?? "",
        data.serviceChargePercent ?? 0,
        data.businessName ?? null,
        data.businessAddress ?? null,
        data.businessPhone ?? null,
      ],
    );
  }
}

/**
 * Daftar outlet untuk tenant.
 */
export async function getRestoOutlets(
  tenantId: string,
): Promise<RestoOutlet[]> {
  const result = await db.query<{
    id: string;
    tenant_id: string;
    name: string;
    address: string | null;
    phone: string | null;
    is_active: boolean;
  }>(
    `SELECT
       id,
       "tenantId" AS tenant_id,
       name,
       address,
       phone,
       "isActive" AS is_active
     FROM "Outlet"
     WHERE "tenantId" = $1
     ORDER BY name ASC`,
    [tenantId],
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

/**
 * Konfigurasi struk untuk tenant.
 */
export async function getRestoReceiptConfig(
  tenantId: string,
): Promise<RestoReceiptConfig> {
  const settings = await getRestoTenantSettings(tenantId);

  return {
    tenantId,
    businessName: settings?.businessName ?? "Restoran",
    businessAddress: settings?.businessAddress ?? null,
    businessPhone: settings?.businessPhone ?? null,
    taxPercent: settings?.taxPercent ?? 10,
    serviceChargePercent: settings?.serviceChargePercent ?? 0,
    footerMessage: settings?.receiptFooter ?? null,
    staticQrisPayload: settings?.staticQrisPayload ?? null,
  };
}
