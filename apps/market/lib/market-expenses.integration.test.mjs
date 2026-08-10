import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test from "node:test";
import process from "node:process";

const databaseUrl = process.env.DATABASE_URL;
const skip = databaseUrl ? undefined : "DATABASE_URL tidak tersedia";

test("expenses: create + list, tenant isolation", { skip }, async () => {
  if (!databaseUrl) return;
  const { Pool } = await import("pg");
  const { createMarketExpense, listMarketExpenses } = await import("./market-expenses.ts");
  const pool = new Pool({ connectionString: databaseUrl });

  const sfx = randomUUID().slice(0, 8);
  const t = `it_t_${sfx}`, outlet = `it_o_${sfx}`, owner = `it_u_${sfx}`;
  let ok = false;

  try {
    const fx = await pool.connect();
    try {
      await fx.query("BEGIN");
      await fx.query(`INSERT INTO "Tenant" (id,name) VALUES ($1,'IT')`, [t]);
      await fx.query(`INSERT INTO "Outlet" (id,"tenantId",name,"isActive") VALUES ($1,$2,'O',true)`, [outlet, t]);
      await fx.query(`INSERT INTO "User" (id,"tenantId",name,email,"passwordHash",role,"isActive") VALUES ($1,$2,'U',$3,'x','OWNER',true)`, [owner, t, `u-${sfx}@t`]);
      await fx.query(`INSERT INTO "UserOutlet" (id,"tenantId","userId","outletId") VALUES ($1,$2,$3,$4)`, [`it_uo_${sfx}`, t, owner, outlet]);
      await fx.query("COMMIT");
      ok = true;
    } finally { fx.release(); }

    // Create 2 expenses
    await createMarketExpense({ tenantId: t, outletId: outlet, category: "RENT", amount: 5000000, description: "Sewa bulanan", createdById: owner });
    await createMarketExpense({ tenantId: t, outletId: outlet, category: "UTILITIES", amount: 500000, createdById: owner });

    // List only this tenant's expenses
    const list = await listMarketExpenses(t);
    assert.equal(list.length, 2, "ada 2 expense");
    assert.equal(list[0].category, "UTILITIES", "terbaru dulu");
    assert.equal(list[0].amount, 500000);
    assert.equal(list[1].category, "RENT");
    assert.equal(list[1].amount, 5000000);

    // Tenant isolation: empty for other tenant
    const otherList = await listMarketExpenses("nonexistent-tenant");
    assert.equal(otherList.length, 0, "other tenant kosong");
  } finally {
    if (ok) {
      try {
        const cl = await pool.connect();
        try {
          await cl.query("BEGIN");
          await cl.query(`DELETE FROM "Expense" WHERE "tenantId"=$1`, [t]);
          await cl.query(`DELETE FROM "UserOutlet" WHERE "userId"=$1`, [owner]);
          await cl.query(`DELETE FROM "User" WHERE id=$1`, [owner]);
          await cl.query(`DELETE FROM "Outlet" WHERE id=$1`, [outlet]);
          await cl.query(`DELETE FROM "Tenant" WHERE id=$1`, [t]);
          await cl.query("COMMIT");
        } catch { try { await cl.query("ROLLBACK"); /* ignore */ } catch { /* ignore */ } } finally { cl.release(); }
      } catch (e) { console.error("cleanup failed:", e.message); }
    }
    await pool.end();
  }
});
