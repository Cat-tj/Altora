import assert from "node:assert/strict";
import test from "node:test";
import { inspectRepositoryHealth } from "./check-repository-health.mjs";

test("every declared product has an explicit product README and no Next.js template copy", async () => {
  const result = await inspectRepositoryHealth();
  assert.deepEqual(result.missingReadmes, []);
  assert.deepEqual(result.templateReadmes, []);
  assert.deepEqual(result.unknownProductApps, []);
});
