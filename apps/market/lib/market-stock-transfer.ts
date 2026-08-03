import { db } from "./db";

export type StockTransferRecord = {
  id: string;
  tenantId: string;
  fromOutletName: string;
  toOutletName: string;
  productName: string;
  qty: number;
  status: string;
  createdByName: string;
  createdAt: string;
};

export async function listStockTransfers(tenantId: string): Promise<StockTransferRecord[]> {
  const result = await db.query<{
    id: string;
    tenant_id: string;
    from_outlet_name: string;
    to_outlet_name: string;
    product_name: string;
    qty: number;
    status: string;
    created_by_name: string;
    created_at: Date;
  }>(
    `SELECT st.id,
            st."tenantId" AS tenant_id,
            o1.name AS from_outlet_name,
            o2.name AS to_outlet_name,
            p.name AS product_name,
            st.qty,
            st.status,
            u.name AS created_by_name,
            st."createdAt" AS created_at
       FROM "StockTransfer" st
       JOIN "Outlet" o1 ON o1.id = st."fromOutletId"
       JOIN "Outlet" o2 ON o2.id = st."toOutletId"
       JOIN "Product" p ON p.id = st."productId"
       JOIN "User" u ON u.id = st."createdById"
      WHERE st."tenantId" = $1
      ORDER BY st."createdAt" DESC`,
    [tenantId]
  );

  return result.rows.map((row) => ({
    id: row.id,
    tenantId: row.tenant_id,
    fromOutletName: row.from_outlet_name,
    toOutletName: row.to_outlet_name,
    productName: row.product_name,
    qty: row.qty,
    status: row.status,
    createdByName: row.created_by_name,
    createdAt: row.created_at.toISOString(),
  }));
}

export async function createStockTransfer(data: {
  tenantId: string;
  fromOutletId: string;
  toOutletId: string;
  productId: string;
  qty: number;
  createdById: string;
}): Promise<void> {
  const id = `TRF-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  await db.query(
    `INSERT INTO "StockTransfer" (id, "tenantId", "fromOutletId", "toOutletId", "productId", qty, "createdById")
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [id, data.tenantId, data.fromOutletId, data.toOutletId, data.productId, data.qty, data.createdById]
  );
}
