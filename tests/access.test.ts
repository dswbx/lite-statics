import { describe, expect, it } from "vitest";
import { decideAccess, accessCookieSecure, signedAccessCookie } from "../src/worker/access";
import type { Env } from "../src/worker/env";

const env = {
  ACCESS_COOKIE_NAME: "access",
  COOKIE_SECRET: "test-secret",
} as Env;

describe("access decisions", () => {
  it("allows public deployed sites", async () => {
    const decision = await decideAccess(env, new Request("https://example.com/s/demo/"), {
      id: "site_1",
      slug: "demo",
      access_mode: "public",
      password_hash: null,
      password_salt: null,
      expires_at: null,
      disabled_at: null,
      active_deployment_id: "dep_1",
    });

    expect(decision.status).toBe("allow");
  });

  it("blocks expired sites before loading a Dynamic Worker", async () => {
    const decision = await decideAccess(env, new Request("https://example.com/s/demo/"), {
      id: "site_1",
      slug: "demo",
      access_mode: "public",
      password_hash: null,
      password_salt: null,
      expires_at: "2020-01-01T00:00:00.000Z",
      disabled_at: null,
      active_deployment_id: "dep_1",
    });

    expect(decision).toEqual({ status: "inactive", reason: "expired" });
  });

  it("allows password sites with a signed cookie", async () => {
    const cookie = await signedAccessCookie(env, "site_1");
    const request = new Request("https://example.com/s/demo/", {
      headers: { cookie: `access=${cookie}` },
    });
    const decision = await decideAccess(env, request, {
      id: "site_1",
      slug: "demo",
      access_mode: "password",
      password_hash: "hash",
      password_salt: "salt",
      expires_at: null,
      disabled_at: null,
      active_deployment_id: "dep_1",
    });

    expect(decision.status).toBe("allow");
  });

  it("skips secure cookies on local http hosts", () => {
    expect(accessCookieSecure(new Request("https://127.0.0.1:5180/api/sites/demo/password"))).toBe(false);
    expect(accessCookieSecure(new Request("https://example.com/api/sites/demo/password", { headers: { "x-forwarded-proto": "https" } }))).toBe(true);
    expect(accessCookieSecure(new Request("http://example.com/api/sites/demo/password"))).toBe(false);
  });
});
