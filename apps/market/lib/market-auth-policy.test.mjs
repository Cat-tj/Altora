import assert from "node:assert/strict";
import test from "node:test";
import { resolveSafeCallbackPath } from "./market-auth-policy.mjs";

test("accepts a relative Market callback path", () => {
  assert.equal(resolveSafeCallbackPath("/kasir"), "/kasir");
});

test("rejects cross-origin and protocol-relative callback URLs", () => {
  assert.equal(resolveSafeCallbackPath("https://evil.example"), "/simple/hari-ini");
  assert.equal(resolveSafeCallbackPath("//evil.example"), "/simple/hari-ini");
});

test("does not redirect a signed-in user back to login", () => {
  assert.equal(resolveSafeCallbackPath("/login"), "/simple/hari-ini");
});
