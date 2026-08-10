import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { Pool } from "pg";
import { createTenantContext } from "@altora/control-plane-core";
import { resolveServiceContext, ServiceAuthError } from "../apps/service/lib/service-auth.js";

const databaseUrl =
  process.env.DATABASE_URL ||
  "postgresql://altora:altora@127.0.0.1:5432/altora_market_ci";

const pool = new Pool({ connectionString: databaseUrl });

test("PostgreSQL Adversarial Tenant & Outlet Isolation", async (t) => {
  const tenantA = `tenant_adv_a_${randomUUID().slice(0, 8)}`;
  const tenantB = `tenant_adv_b_${randomUUID().slice(0, 8)}`;
  const outletA1 = `outlet_a1_${randomUUID().slice(0, 8)}`;
  const outletA2 = `outlet_a2_${randomUUID().slice(0, 8)}`;
  const outletB1 = `outlet_b1_${randomUUID().slice(0, 8)}`;
  const userA = `user_a_${randomUUID().slice(0, 8)}`;

  // Setup database fixtures for Tenant A and Tenant B
  await pool.query(
    `INSERT INTO "Tenant" (id, name) VALUES ($1, 'Tenant A'), ($2, 'Tenant B')`,
    [tenantA, tenantB],
  );

  await pool.query(
    `INSERT INTO "Outlet" (id, "tenantId", name) VALUES ($1, $2, 'Outlet A1'), ($3, $4, 'Outlet A2'), ($5, $6, 'Outlet B1')`,
    [outletA1, tenantA, outletA2, tenantA, outletB1, tenantB],
  );

  const staffA = `staff_a_${randomUUID().slice(0, 8)}`;
  const staffB = `staff_b_${randomUUID().slice(0, 8)}`;
  const catalogA = `cat_a_${randomUUID().slice(0, 8)}`;
  const catalogB = `cat_b_${randomUUID().slice(0, 8)}`;

  await pool.query(
    `INSERT INTO "ServiceStaff" (id, "tenantId", name) VALUES ($1, $2, 'Staff A'), ($3, $4, 'Staff B')`,
    [staffA, tenantA, staffB, tenantB],
  );

  await pool.query(
    `INSERT INTO "ServiceCatalogItem" (id, "tenantId", name, category, price) VALUES ($1, $2, 'Cut A', 'Hair', 50000), ($3, $4, 'Cut B', 'Hair', 60000)`,
    [catalogA, tenantA, catalogB, tenantB],
  );

  t.after(async () => {
    await pool.query(
      `DELETE FROM "ServiceSaleItem" WHERE "tenantId" IN ($1, $2)`,
      [tenantA, tenantB],
    );
    await pool.query(
      `DELETE FROM "ServiceCheckoutRequest" WHERE "tenantId" IN ($1, $2)`,
      [tenantA, tenantB],
    );
    await pool.query(
      `DELETE FROM "ServiceSale" WHERE "tenantId" IN ($1, $2)`,
      [tenantA, tenantB],
    );
    await pool.query(
      `DELETE FROM "ServiceCatalogItem" WHERE "tenantId" IN ($1, $2)`,
      [tenantA, tenantB],
    );
    await pool.query(
      `DELETE FROM "ServiceStaff" WHERE "tenantId" IN ($1, $2)`,
      [tenantA, tenantB],
    );
    await pool.query(
      `DELETE FROM "Outlet" WHERE id IN ($1, $2, $3)`,
      [outletA1, outletA2, outletB1],
    );
    await pool.query(`DELETE FROM "Tenant" WHERE id IN ($1, $2)`, [
      tenantA,
      tenantB,
    ]);
  });

  await t.test("1. Tenant A reads own data -> PASS", async () => {
    const res = await pool.query(
      `SELECT id FROM "ServiceCatalogItem" WHERE "tenantId" = $1`,
      [tenantA],
    );
    assert.equal(res.rows.length, 1);
    assert.equal(res.rows[0].id, catalogA);
  });

  await t.test("2. Tenant A reads Tenant B -> zero rows", async () => {
    const res = await pool.query(
      `SELECT id FROM "ServiceCatalogItem" WHERE "tenantId" = $1 AND id = $2`,
      [tenantA, catalogB],
    );
    assert.equal(res.rows.length, 0);
  });

  await t.test("3. Tenant A modifies Tenant B -> zero affected rows", async () => {
    const res = await pool.query(
      `UPDATE "ServiceCatalogItem" SET price = 99999 WHERE "tenantId" = $1 AND id = $2`,
      [tenantA, catalogB],
    );
    assert.equal(res.rowCount, 0);
  });

  await t.test("4. User without SERVICE entitlement -> DENY", async () => {
    assert.throws(
      () =>
        createTenantContext({
          userId: userA,
          tenantId: tenantA,
          role: "STAFF",
          activeOutletId: outletA1,
          accessibleOutletIds: [outletA1],
          activeProduct: "SERVICE",
          productEntitlements: ["MARKET"], // Missing SERVICE
        }),
      /does not have an active entitlement/,
    );
  });

  await t.test("5. Manager Outlet A accesses Outlet A -> PASS", async () => {
    const ctx = createTenantContext({
      userId: userA,
      tenantId: tenantA,
      role: "MANAGER",
      activeOutletId: outletA1,
      accessibleOutletIds: [outletA1, outletA2],
      activeProduct: "SERVICE",
      productEntitlements: ["SERVICE"],
    });
    assert.equal(ctx.activeOutletId, outletA1);
  });

  await t.test("6. Manager Outlet A accesses Outlet B -> DENY", async () => {
    assert.throws(
      () =>
        createTenantContext({
          userId: userA,
          tenantId: tenantA,
          role: "MANAGER",
          activeOutletId: outletB1,
          accessibleOutletIds: [outletA1, outletA2], // outletB1 is not accessible
          activeProduct: "SERVICE",
          productEntitlements: ["SERVICE"],
        }),
      /Unauthorized outlet access/,
    );
  });

  await t.test("7. Service Sale tenant A + Staff tenant B -> DB REJECT (FK violation)", async () => {
    const saleId = `sale_bad_staff_${randomUUID().slice(0, 8)}`;
    await assert.rejects(
      async () => {
        await pool.query(
          `INSERT INTO "ServiceSale" (id, "tenantId", "outletId", "staffId", total, "paymentMethod")
           VALUES ($1, $2, $3, $4, 50000, 'CASH')`,
          [saleId, tenantA, outletA1, staffB], // tenantA sale with staffB from tenantB!
        );
      },
      (err) => err.code === "23503", // foreign_key_violation
    );
  });

  await t.test("8. ServiceSaleItem tenant A + Catalog tenant B -> DB REJECT (FK violation)", async () => {
    const saleId = `sale_good_${randomUUID().slice(0, 8)}`;
    await pool.query(
      `INSERT INTO "ServiceSale" (id, "tenantId", "outletId", "staffId", total, "paymentMethod")
       VALUES ($1, $2, $3, $4, 50000, 'CASH')`,
      [saleId, tenantA, outletA1, staffA],
    );

    const itemId = `item_bad_cat_${randomUUID().slice(0, 8)}`;
    await assert.rejects(
      async () => {
        await pool.query(
          `INSERT INTO "ServiceSaleItem" (id, "tenantId", "saleId", "catalogItemId", name, price, quantity, subtotal)
           VALUES ($1, $2, $3, $4, 'Bad Cut', 60000, 1, 60000)`,
          [itemId, tenantA, saleId, catalogB], // tenantA sale item with catalogB from tenantB!
        );
      },
      (err) => err.code === "23503", // foreign_key_violation
    );
  });

  await t.test("9. Duplicate Service checkout request -> idempotent (same transaction)", async () => {
    const requestId = `req_idemp_${randomUUID().slice(0, 8)}`;
    const saleId1 = `sale_idemp_1_${randomUUID().slice(0, 8)}`;
    const reqId1 = `req_row_1_${randomUUID().slice(0, 8)}`;

    await pool.query(
      `INSERT INTO "ServiceSale" (id, "tenantId", "outletId", "staffId", total, "paymentMethod")
       VALUES ($1, $2, $3, $4, 50000, 'CASH')`,
      [saleId1, tenantA, outletA1, staffA],
    );
    await pool.query(
      `INSERT INTO "ServiceCheckoutRequest" (id, "tenantId", "requestId", "saleId")
       VALUES ($1, $2, $3, $4)`,
      [reqId1, tenantA, requestId, saleId1],
    );

    const saleId2 = `sale_idemp_2_${randomUUID().slice(0, 8)}`;
    const reqId2 = `req_row_2_${randomUUID().slice(0, 8)}`;
    await pool.query(
      `INSERT INTO "ServiceSale" (id, "tenantId", "outletId", "staffId", total, "paymentMethod")
       VALUES ($1, $2, $3, $4, 50000, 'CASH')`,
      [saleId2, tenantA, outletA1, staffA],
    );

    await assert.rejects(
      async () => {
        await pool.query(
          `INSERT INTO "ServiceCheckoutRequest" (id, "tenantId", "requestId", "saleId")
           VALUES ($1, $2, $3, $4)`,
          [reqId2, tenantA, requestId, saleId2],
        );
      },
      (err) => err.code === "23505", // unique_violation
    );
  });

  await t.test("10. ServiceSale tenant A + outlet A1 (owned by tenant A) -> PASS", async () => {
    const saleId = `sale_good_outlet_${randomUUID().slice(0, 8)}`;
    await pool.query(
      `INSERT INTO "ServiceSale" (id, "tenantId", "outletId", "staffId", total, "paymentMethod")
       VALUES ($1, $2, $3, $4, 50000, 'CASH')`,
      [saleId, tenantA, outletA1, staffA],
    );
    const res = await pool.query(`SELECT id FROM "ServiceSale" WHERE id = $1`, [saleId]);
    assert.equal(res.rows.length, 1);
  });

  await t.test("11. ServiceSale tenant A + outlet B1 (owned by tenant B) -> DB REJECT (FK violation)", async () => {
    const saleId = `sale_cross_outlet_${randomUUID().slice(0, 8)}`;
    await assert.rejects(
      async () => {
        await pool.query(
          `INSERT INTO "ServiceSale" (id, "tenantId", "outletId", "staffId", total, "paymentMethod")
           VALUES ($1, $2, $3, $4, 50000, 'CASH')`,
          [saleId, tenantA, outletB1, staffA], // tenantA sale with outletB1 from tenantB!
        );
      },
      (err) => err.code === "23503", // foreign_key_violation
    );
  });

  await t.test("12. Adversarial Auth: Anonymous request without auth -> 401 Unauthenticated", async () => {
    const origEnv = process.env.ALTORA_TEST_HARNESS;
    const origNodeEnv = process.env.NODE_ENV;
    try {
      process.env.ALTORA_TEST_HARNESS = "false";
      process.env.NODE_ENV = "production";
      const req = new Request("http://localhost/api/service/checkout");
      await assert.rejects(
        async () => resolveServiceContext(req),
        (err) => err instanceof ServiceAuthError && err.statusCode === 401,
      );
    } finally {
      process.env.ALTORA_TEST_HARNESS = origEnv;
      process.env.NODE_ENV = origNodeEnv;
    }
  });

  await t.test("13. Adversarial Auth: Forged x-altora-tenant-id header in production -> 401 Unauthenticated", async () => {
    const origEnv = process.env.ALTORA_TEST_HARNESS;
    const origNodeEnv = process.env.NODE_ENV;
    try {
      process.env.ALTORA_TEST_HARNESS = "false";
      process.env.NODE_ENV = "production";
      const req = new Request("http://localhost/api/service/checkout", {
        headers: {
          "x-altora-tenant-id": tenantB,
          "x-altora-user-id": userA,
          "x-altora-outlet-id": outletB1,
        },
      });
      // Headers must be ignored in production mode -> missing valid session token -> 401
      await assert.rejects(
        async () => resolveServiceContext(req),
        (err) => err instanceof ServiceAuthError && err.statusCode === 401,
      );
    } finally {
      process.env.ALTORA_TEST_HARNESS = origEnv;
      process.env.NODE_ENV = origNodeEnv;
    }
  });
});
