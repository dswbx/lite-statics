import { createTestHarness } from "wrangler";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const apikey = "local-dev-key";

describe("auth integration", () => {
  const server = createTestHarness({
    workers: [{ configPath: "./wrangler.jsonc" }],
  });

  beforeAll(async () => {
    await server.listen();
    await server.getWorker().applyD1Migrations("DB");
  });

  afterAll(async () => {
    await server.close();
  });

  async function signUp(email: string, password = "password123") {
    return server.fetch("http://example.com/auth/v1/signup", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        apikey,
      },
      body: JSON.stringify({ email, password }),
    });
  }

  async function signIn(email: string, password = "password123") {
    return server.fetch("http://example.com/auth/v1/token?grant_type=password", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        apikey,
      },
      body: JSON.stringify({ email, password }),
    });
  }

  it("signs up a new user and returns a session", async () => {
    const email = `signup-${crypto.randomUUID()}@example.com`;
    const response = await signUp(email);

    expect(response.status).toBe(200);
    const body = (await response.json()) as {
      access_token: string;
      user: { email: string };
    };
    expect(body.access_token).toBeTruthy();
    expect(body.user.email).toBe(email);
  });

  it("signs in with email and password", async () => {
    const email = `signin-${crypto.randomUUID()}@example.com`;
    const signUpResponse = await signUp(email);
    expect(signUpResponse.status).toBe(200);

    const response = await signIn(email);

    expect(response.status).toBe(200);
    const body = (await response.json()) as {
      access_token: string;
      user: { email: string };
    };
    expect(body.access_token).toBeTruthy();
    expect(body.user.email).toBe(email);
  });

  it("rejects invalid credentials", async () => {
    const response = await signIn("missing-user@example.com", "wrong-password");

    expect(response.status).toBe(400);
    const body = (await response.json()) as { error_code: string };
    expect(body.error_code).toBe("invalid_credentials");
  });
});
