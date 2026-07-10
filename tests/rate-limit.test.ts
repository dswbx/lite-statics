import { Hono } from "hono";
import { describe, expect, it } from "vitest";
import type { AppEnv } from "../src/worker/client";
import { rateLimit, rateLimitIdentifier } from "../src/worker/middleware/rate-limit";
import { rateLimitResponseHeaders } from "../src/worker/middleware/rate-limit-policies";
import type { Env } from "../src/worker/env";

function createJwt(payload: Record<string, unknown>): string {
  const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body = btoa(JSON.stringify(payload));
  return `${header}.${body}.signature`;
}

describe("rate limit helpers", () => {
  it("builds standard rate limit headers", () => {
    expect(rateLimitResponseHeaders({ limit: 60, period: 60 }, { success: true })).toEqual({
      "RateLimit-Limit": "60",
      "RateLimit-Reset": "60",
      "RateLimit-Policy": "60;w=60",
    });
    expect(rateLimitResponseHeaders({ limit: 60, period: 60 }, { success: false })).toEqual({
      "RateLimit-Limit": "60",
      "RateLimit-Reset": "60",
      "RateLimit-Policy": "60;w=60",
      "RateLimit-Remaining": "0",
      "Retry-After": "60",
    });
  });

  it("prefers jwt subject over ip for the identifier", () => {
    const token = createJwt({ sub: "user-123" });
    const request = new Request("https://example.com/rest/v1/sites", {
      headers: {
        Authorization: `Bearer ${token}`,
        "cf-connecting-ip": "203.0.113.10",
      },
    });

    expect(rateLimitIdentifier(request)).toBe("user-123");
  });

  it("falls back to cf-connecting-ip when no jwt subject is present", () => {
    const request = new Request("https://example.com/s/demo/", {
      headers: { "cf-connecting-ip": "203.0.113.10" },
    });

    expect(rateLimitIdentifier(request)).toBe("203.0.113.10");
  });
});

describe("rateLimit middleware", () => {
  it("returns 429 when the limiter rejects the request", async () => {
    const app = new Hono<AppEnv>();
    app.use("*", rateLimit);
    app.get("/api/sites/demo", (c) => c.text("ok"));

    const env = {
      RATE_LIMIT: {
        limit: async () => ({ success: false }),
      },
    } as unknown as Env;

    const response = await app.fetch(new Request("https://example.com/api/sites/demo"), env);
    expect(response.status).toBe(429);
    expect(await response.json()).toEqual({ error: "Too many requests" });
    expect(response.headers.get("RateLimit-Limit")).toBe("60");
    expect(response.headers.get("RateLimit-Remaining")).toBe("0");
    expect(response.headers.get("RateLimit-Reset")).toBe("60");
    expect(response.headers.get("RateLimit-Policy")).toBe("60;w=60");
    expect(response.headers.get("Retry-After")).toBe("60");
  });

  it("adds rate limit headers to successful responses", async () => {
    const app = new Hono<AppEnv>();
    app.use("*", rateLimit);
    app.get("/api/sites/demo", (c) => c.text("ok"));

    const env = {
      RATE_LIMIT: {
        limit: async () => ({ success: true }),
      },
    } as unknown as Env;

    const response = await app.fetch(new Request("https://example.com/api/sites/demo"), env);
    expect(response.status).toBe(200);
    expect(await response.text()).toBe("ok");
    expect(response.headers.get("RateLimit-Limit")).toBe("60");
    expect(response.headers.get("RateLimit-Reset")).toBe("60");
    expect(response.headers.get("RateLimit-Policy")).toBe("60;w=60");
    expect(response.headers.get("RateLimit-Remaining")).toBeNull();
  });

  it("skips rate limiting when the binding is missing", async () => {
    const app = new Hono<AppEnv>();
    app.use("*", rateLimit);
    app.get("/api/sites/demo", (c) => c.text("ok"));

    const env = {} as Env;
    const response = await app.fetch(new Request("https://example.com/api/sites/demo"), env);
    expect(response.status).toBe(200);
    expect(await response.text()).toBe("ok");
  });
});
