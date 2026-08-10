import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test from "node:test";
import process from "node:process";

const databaseUrl = process.env.DATABASE_URL;
const skip = databaseUrl ? undefined : "DATABASE_URL tidak tersedia";

test("attendance: clock in + clock out, tenant isolation", { skip }, async () => {
  if (!databaseUrl) return;
  const { Pool } = await import("pg");
  const pool = new Pool({ connectionString: databaseUrl });

  const sfx = randomUUID().slice(0, 8);
  const t = `it_t_${sfx}`, o = `it_o_${sfx}`, staff = `it_s_${sfx}`;
  let ok = false;

  try {
    const fx = await pool.connect();
    try {
      await fx.query("BEGIN");
      await fx.query(`INSERT INTO "Tenant" (id,name) VALUES ($1,'IT')`, [t]);
      await fx.query(`INSERT INTO "Outlet" (id,"tenantId",name,"isActive") VALUES ($1,$2,'O',true)`, [o, t]);
      await fx.query(`INSERT INTO "User" (id,"tenantId",name,email,"passwordHash",role,"isActive") VALUES ($1,$2,'Staff',$3,'x','STAFF',true)`, [staff, t, `s-${sfx}@t`]);
      await fx.query(`INSERT INTO "UserOutlet" (id,"tenantId","userId","outletId") VALUES ($1,$2,$3,$4)`, [`it_uo_${sfx}`, t, staff, o]);
      await fx.query("COMMIT");
      ok = true;
    } finally { fx.release(); }

    // Clock in
    const attId = `it_att_${sfx}`;
    await pool.query(`INSERT INTO "Attendance" (id,"tenantId","outletId","userId","clockIn") VALUES ($1,$2,$3,$4,NOW())`, [attId, t, o, staff]);
    const inRow = (await pool.query(`SELECT "clockIn" IS NOT NULL AS has_in, "clockOut" IS NULL AS no_out FROM "Attendance" WHERE id=$1`, [attId])).rows[0];
    assert.equal(inRow.has_in, true, "clockIn tercatat");
    assert.equal(inRow.no_out, true, "belum clockOut");

    // Clock out
    await pool.query(`UPDATE "Attendance" SET "clockOut"=NOW() WHERE id=$1`, [attId]);
    const outRow = (await pool.query(`SELECT "clockOut" IS NOT NULL AS has_out FROM "Attendance" WHERE id=$1`, [attId])).rows[0];
    assert.equal(outRow.has_out, true, "clockOut tercatat");

    // Tenant isolation
    const other = await pool.query(`SELECT COUNT(*)::int AS c FROM "Attendance" WHERE "tenantId"='nonexistent'`);
    assert.equal(other.rows[0].c, 0);
  } finally {
    if (ok) {
      try {
        const cl = await pool.connect();
        try {
          await cl.query("BEGIN");
          await cl.query(`DELETE FROM "Attendance" WHERE "tenantId"=$1`, [t]);
          await cl.query(`DELETE FROM "UserOutlet" WHERE "userId"=$1`, [staff]);
          await cl.query(`DELETE FROM "User" WHERE id=$1`, [staff]);
          await cl.query(`DELETE FROM "Outlet" WHERE id=$1`, [o]);
          await cl.query(`DELETE FROM "Tenant" WHERE id=$1`, [t]);
          await cl.query("COMMIT");
        } catch { try { await cl.query("ROLLBACK"); /* ignore */ } catch { /* ignore */ } } finally { cl.release(); }
      } catch (e) { console.error("cleanup failed:", e.message); }
    }
    await pool.end();
  }
});
