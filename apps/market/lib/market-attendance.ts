import { db } from "./db";

export type AttendanceRecord = {
  id: string;
  tenantId: string;
  outletId: string;
  outletName?: string;
  userId: string;
  userName?: string;
  clockIn: string;
  clockOut: string | null;
  notes: string | null;
};

export async function listAttendances(tenantId: string): Promise<AttendanceRecord[]> {
  const result = await db.query<{
    id: string;
    tenant_id: string;
    outlet_id: string;
    outlet_name: string;
    user_id: string;
    user_name: string;
    clock_in: Date;
    clock_out: Date | null;
    notes: string | null;
  }>(
    `SELECT a.id,
            a."tenantId" AS tenant_id,
            a."outletId" AS outlet_id,
            o.name AS outlet_name,
            a."userId" AS user_id,
            u.name AS user_name,
            COALESCE(a."clockIn", a."clockInAt") AS clock_in,
            COALESCE(a."clockOut", a."clockOutAt") AS clock_out,
            a.notes
       FROM "Attendance" a
       JOIN "Outlet" o ON o.id = a."outletId"
       JOIN "User" u ON u.id = a."userId"
      WHERE a."tenantId" = $1
      ORDER BY COALESCE(a."clockIn", a."clockInAt") DESC`,
    [tenantId]
  );

  return result.rows.map((row) => ({
    id: row.id,
    tenantId: row.tenant_id,
    outletId: row.outlet_id,
    outletName: row.outlet_name,
    userId: row.user_id,
    userName: row.user_name,
    clockIn: row.clock_in ? row.clock_in.toISOString() : new Date().toISOString(),
    clockOut: row.clock_out ? row.clock_out.toISOString() : null,
    notes: row.notes,
  }));
}

export async function clockInUser(data: {
  tenantId: string;
  outletId: string;
  userId: string;
  notes?: string;
}): Promise<void> {
  const id = `ATT-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  await db.query(
    `INSERT INTO "Attendance" (id, "tenantId", "outletId", "userId", notes, "clockIn", "clockInAt")
     VALUES ($1, $2, $3, $4, $5, NOW(), NOW())`,
    [id, data.tenantId, data.outletId, data.userId, data.notes || null]
  );
}

export async function clockOutUser(attendanceId: string): Promise<void> {
  await db.query(
    `UPDATE "Attendance"
        SET "clockOut" = NOW(), "clockOutAt" = NOW()
      WHERE id = $1 AND "clockOut" IS NULL`,
    [attendanceId]
  );
}
