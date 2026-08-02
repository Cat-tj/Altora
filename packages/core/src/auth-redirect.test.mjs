import assert from "node:assert/strict";
import test from "node:test";
import { resolveProductLoginUrl } from "./auth-redirect.js";

test("keeps a local login callback on the active local origin", () => {
  assert.equal(
    resolveProductLoginUrl("http://localhost:3002", "market.altora.my.id"),
    "http://localhost:3002/login",
  );
});

test("keeps a deployed product login callback on its own Altora subdomain", () => {
  assert.equal(
    resolveProductLoginUrl("https://market.altora.my.id", "market.altora.my.id"),
    "https://market.altora.my.id/login",
  );
});

test("does not accept an arbitrary or localhost production callback origin", () => {
  assert.equal(
    resolveProductLoginUrl("https://evil.example", "market.altora.my.id"),
    "https://market.altora.my.id/login",
  );
  assert.equal(
    resolveProductLoginUrl("not a url", "market.altora.my.id"),
    "https://market.altora.my.id/login",
  );
});

test("does not point a product logout at another Altora application", () => {
  assert.equal(
    resolveProductLoginUrl("https://market.altora.my.id", "resto.altora.my.id"),
    "https://resto.altora.my.id/login",
  );
});
