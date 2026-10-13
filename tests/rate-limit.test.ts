import assert from "node:assert/strict";
import test from "node:test";
import { rateLimit } from "@/lib/rate-limit";

test("limita tentativas repetidas no mesmo endereço", () => {
  const request = new Request("https://organiza.test/api/auth/login", {
    headers: { "x-forwarded-for": "203.0.113.10" },
  });
  const scope = `login-${Date.now()}`;

  assert.equal(rateLimit(request, scope, { limit: 2, windowMs: 60_000 }).allowed, true);
  assert.equal(rateLimit(request, scope, { limit: 2, windowMs: 60_000 }).allowed, true);

  const blocked = rateLimit(request, scope, { limit: 2, windowMs: 60_000 });
  assert.equal(blocked.allowed, false);
  assert.ok(blocked.retryAfterSeconds > 0);
});

test("separa limites por endereço e por escopo", () => {
  const firstRequest = new Request("https://organiza.test/api/auth/login", {
    headers: { "x-forwarded-for": "203.0.113.11" },
  });
  const secondRequest = new Request("https://organiza.test/api/auth/login", {
    headers: { "x-forwarded-for": "203.0.113.12" },
  });
  const scope = `register-${Date.now()}`;

  assert.equal(rateLimit(firstRequest, scope, { limit: 1, windowMs: 60_000 }).allowed, true);
  assert.equal(rateLimit(firstRequest, scope, { limit: 1, windowMs: 60_000 }).allowed, false);
  assert.equal(rateLimit(secondRequest, scope, { limit: 1, windowMs: 60_000 }).allowed, true);
  assert.equal(rateLimit(firstRequest, `${scope}-other`, { limit: 1, windowMs: 60_000 }).allowed, true);
});
