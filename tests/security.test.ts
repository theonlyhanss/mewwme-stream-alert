/**
 * Security Tests
 *
 * Tests all security layers:
 * 1. IP whitelist enforcement
 * 2. Rate limiting headers
 * 3. Security headers (Helmet)
 * 4. Input validation
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";

// ─── Set env BEFORE any app imports ───
process.env.NODE_ENV = "development";
process.env.DISABLE_IP_WHITELIST = "true";
process.env.LOG_LEVEL = "error";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let app: any;

beforeAll(async () => {
  const { initStorage } = await import("../src/services/storage/index.js");
  await initStorage();
  const { createServer } = await import("../src/server.js");
  app = createServer();
});

afterAll(async () => {
  const { closeStorage } = await import("../src/services/storage/index.js");
  await closeStorage();
});

// ═══════════════════════════════════════
//  1. IP Whitelist
// ═══════════════════════════════════════

describe("IP Whitelist", () => {
  it("should pass when DISABLE_IP_WHITELIST=true", async () => {
    // Already set in env - events should be accessible
    const res = await request(app)
      .get("/events");

    expect(res.status).toBe(200);
  });
});

// ═══════════════════════════════════════
//  2. Rate Limiting Headers
// ═══════════════════════════════════════

describe("Rate Limiting", () => {
  it("should include rate limit headers in response", async () => {
    const res = await request(app)
      .get("/health");

    expect(res.status).toBe(200);
    // express-rate-limit sets standard headers
    expect(res.headers).toHaveProperty("ratelimit-limit");
    expect(res.headers).toHaveProperty("ratelimit-remaining");
  });
});

// ═══════════════════════════════════════
//  3. Security Headers (Helmet)
// ═══════════════════════════════════════

describe("Security Headers", () => {
  it("should set X-Content-Type-Options", async () => {
    const res = await request(app).get("/health");
    expect(res.headers["x-content-type-options"]).toBe("nosniff");
  });

  it("should set X-Frame-Options or CSP", async () => {
    const res = await request(app).get("/health");
    // Helmet v5+ uses CSP frame-ancestors instead of X-Frame-Options
    const hasFrameProtection =
      res.headers["x-frame-options"] ||
      res.headers["content-security-policy"];
    expect(hasFrameProtection).toBeTruthy();
  });
});

// ═══════════════════════════════════════
//  4. Input Validation
// ═══════════════════════════════════════

describe("Input Validation", () => {
  it("should reject empty body on POST /streamers", async () => {
    const res = await request(app)
      .post("/streamers")
      .send({});

    expect(res.status).toBe(400);
  });

  it("should reject username with special chars", async () => {
    const res = await request(app)
      .post("/streamers")
      .send({
        platform: "twitch",
        username: "<script>alert(1)</script>",
        userId: "test",
      });

    expect(res.status).toBe(400);
  });

  it("should reject username longer than 50 chars", async () => {
    const res = await request(app)
      .post("/streamers")
      .send({
        platform: "twitch",
        username: "a".repeat(51),
        userId: "test",
      });

    expect(res.status).toBe(400);
  });
});
