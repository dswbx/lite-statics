import { createTestHarness } from "wrangler";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const apikey = "local-dev-key";

const googleClientId = "test-google-client-id.apps.googleusercontent.com";
const googleClientSecret = "test-google-client-secret";

describe("google oauth integration (enabled)", () => {
  const server = createTestHarness({
    workers: [
      {
        configPath: "./wrangler.test.jsonc",
        vars: {
          EMAIL_FROM_ADDRESS: "",
          SITE_URL: "https://statics.supalite.run",
          GOOGLE_CLIENT_ID: googleClientId,
          GOOGLE_CLIENT_SECRET: googleClientSecret,
        },
      },
    ],
  });

  beforeAll(async () => {
    await server.listen();
    await server.getWorker().applyD1Migrations("DB");
  });

  afterAll(async () => {
    await server.close();
  });

  it("advertises google in settings when credentials are configured", async () => {
    const response = await server.fetch("http://example.com/auth/v1/settings", {
      headers: { apikey },
    });
    expect(response.status).toBe(200);
    const body = (await response.json()) as { external: { google: boolean } };
    expect(body.external.google).toBe(true);
  });

  it("redirects /authorize?provider=google to Google when enabled", async () => {
    const url = new URL("http://example.com/auth/v1/authorize");
    url.searchParams.set("provider", "google");
    url.searchParams.set("redirect_to", "http://127.0.0.1:5180/auth/callback");

    const response = await server.fetch(url.toString(), {
      headers: { apikey },
      redirect: "manual",
    });

    expect(response.status).toBe(302);
    const location = response.headers.get("location") ?? "";
    expect(location).toContain("accounts.google.com");
    expect(location).toContain("client_id=" + encodeURIComponent(googleClientId));
    expect(location).toContain(
      "redirect_uri=" + encodeURIComponent("https://statics.supalite.run/auth/v1/callback"),
    );
    expect(location).not.toContain("54321");
  });
});

describe("google oauth integration (disabled)", () => {
  const server = createTestHarness({
    workers: [
      {
        configPath: "./wrangler.test.jsonc",
        // empty strings override any GOOGLE_* from .env so the provider stays off
        vars: {
          EMAIL_FROM_ADDRESS: "",
          SITE_URL: "https://statics.supalite.run",
          GOOGLE_CLIENT_ID: "",
          GOOGLE_CLIENT_SECRET: "",
        },
      },
    ],
  });

  beforeAll(async () => {
    await server.listen();
    await server.getWorker().applyD1Migrations("DB");
  });

  afterAll(async () => {
    await server.close();
  });

  it("does not advertise google when credentials are missing", async () => {
    const response = await server.fetch("http://example.com/auth/v1/settings", {
      headers: { apikey },
    });
    expect(response.status).toBe(200);
    const body = (await response.json()) as { external: { google: boolean } };
    expect(body.external.google).toBe(false);
  });

  it("rejects /authorize?provider=google when the provider is disabled", async () => {
    const url = new URL("http://example.com/auth/v1/authorize");
    url.searchParams.set("provider", "google");
    url.searchParams.set("redirect_to", "http://127.0.0.1:5180/auth/callback");

    const response = await server.fetch(url.toString(), {
      headers: { apikey },
      redirect: "manual",
    });

    expect(response.status).toBe(400);
  });
});
