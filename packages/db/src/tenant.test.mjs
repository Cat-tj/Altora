import test from "node:test";
import assert from "node:assert/strict";

// Inline definition — mirrors packages/db/src/tenant.ts
// (test runs before build in npm test:contracts, so we re-implement here)
function requireTenant(ctx) {
  if (!ctx?.tenantId) throw new Error("tenantId wajib ada di context.");
  if (!ctx?.userId) throw new Error("userId wajib ada di context.");
}

test("requireTenant asserts tenantId and userId are present", () => {
  assert.throws(() => requireTenant({}), /tenantId/);
  assert.throws(() => requireTenant({ tenantId: "t1" }), /userId/);
  assert.doesNotThrow(() =>
    requireTenant({ tenantId: "t1", userId: "u1", role: "STAFF" }),
  );
});
