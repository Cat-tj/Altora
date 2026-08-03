import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { isRoleAllowed } from "./market-authz-policy.mjs";

describe("isRoleAllowed", () => {
  it("returns true when role is in the allowed list", () => {
    assert.strictEqual(isRoleAllowed("OWNER", ["OWNER"]), true);
  });

  it("returns false when role is not in the allowed list", () => {
    assert.strictEqual(isRoleAllowed("STAFF", ["OWNER", "MANAGER"]), false);
  });

  it("returns false when role is undefined", () => {
    assert.strictEqual(isRoleAllowed(undefined, ["OWNER"]), false);
  });

  it("returns false when roles array is empty", () => {
    assert.strictEqual(isRoleAllowed("OWNER", []), false);
  });

  it("returns true when role is one of many allowed roles", () => {
    assert.strictEqual(isRoleAllowed("MANAGER", ["OWNER", "MANAGER", "STAFF"]), true);
  });

  it("denies unknown/unrecognized roles by default", () => {
    assert.strictEqual(isRoleAllowed("SUPERADMIN", ["OWNER", "MANAGER", "STAFF"]), false);
    assert.strictEqual(isRoleAllowed("admin", ["OWNER"]), false);
  });

  it("denies malformed input by default", () => {
    assert.strictEqual(isRoleAllowed(null, ["OWNER"]), false);
    assert.strictEqual(isRoleAllowed("", ["OWNER"]), false);
    assert.strictEqual(isRoleAllowed("OWNER", "OWNER"), false); // roles not an array
    assert.strictEqual(isRoleAllowed("OWNER", ["OWNER", null]), true); // null entries ignored
  });
});
