import assert from "node:assert/strict";
import test from "node:test";
import { checkRateLimit } from "./market-rate-limit.mjs";

test("allows attempts until the Market login limit is reached", () => {
  const key = `market-login-limit-${crypto.randomUUID()}`;

  assert.equal(checkRateLimit(key, 2, 60_000).allowed, true);
  assert.equal(checkRateLimit(key, 2, 60_000).allowed, true);

  const rejected = checkRateLimit(key, 2, 60_000);
  assert.equal(rejected.allowed, false);
  assert.ok(rejected.retryAfterMs > 0);
});

test("isolates login limits by key", () => {
  const firstKey = `market-login-first-${crypto.randomUUID()}`;
  const secondKey = `market-login-second-${crypto.randomUUID()}`;

  assert.equal(checkRateLimit(firstKey, 1, 60_000).allowed, true);
  assert.equal(checkRateLimit(firstKey, 1, 60_000).allowed, false);
  assert.equal(checkRateLimit(secondKey, 1, 60_000).allowed, true);
});
