import assert from "node:assert/strict";
import test from "node:test";

function buildTenantQuery(sql, params, tenantId) {
  if (!tenantId) throw new Error("tenantId wajib ada di context.");
  if (!/\bwhere\b/i.test(sql)) {
    throw new Error("Tenant-scoped query wajib memiliki WHERE clause.");
  }
  if (/tenantid|tenant_id/i.test(sql)) {
    throw new Error("Jangan menyisipkan tenant predicate manual; gunakan tenantQuery.");
  }
  return {
    sql: `${sql} AND "tenantId" = $${params.length + 1}`,
    params: [...params, tenantId],
  };
}

test("tenant query builder always adds tenant predicate and preserves params", () => {
  const result = buildTenantQuery(
    'SELECT * FROM "Product" WHERE "outletId" = $1',
    ["outlet-A"],
    "tenant-A",
  );
  assert.match(result.sql, /"tenantId" = \$2/);
  assert.deepEqual(result.params, ["outlet-A", "tenant-A"]);
});

test("tenant query builder rejects missing context", () => {
  assert.throws(
    () => buildTenantQuery('SELECT * FROM "Product" WHERE active = true', [], ""),
    /tenantId/,
  );
});

test("tenant query builder rejects unscoped query", () => {
  assert.throws(
    () => buildTenantQuery('SELECT * FROM "Product"', [], "tenant-A"),
    /WHERE/,
  );
});

test("tenant query builder rejects duplicate manual tenant predicate", () => {
  assert.throws(
    () => buildTenantQuery('SELECT * FROM "Product" WHERE "tenantId" = $1', [], "tenant-A"),
    /manual/,
  );
});
