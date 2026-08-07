import { createTestHarness } from "wrangler";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { confirmUserEmail, signUpAndConfirm, signUpUser } from "./helpers/auth";

const apikey = "local-dev-key";
const testWorker = {
  configPath: "./wrangler.test.jsonc",
  vars: { EMAIL_FROM_ADDRESS: "" },
};

describe("auth integration", () => {
  const server = createTestHarness({
    workers: [testWorker],
  });

  beforeAll(async () => {
    await server.listen();
    await server.getWorker().applyD1Migrations("DB");
  });

  afterAll(async () => {
    await server.close();
  });

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

  it("signs up without a session until email is confirmed", async () => {
    const email = `signup-${crypto.randomUUID()}@example.com`;
    const { response, body } = await signUpUser(server.fetch.bind(server), email);

    expect(response.status).toBe(200);
    expect("access_token" in body).toBe(false);
    expect(body.email).toBe(email);
  });

  it("signs in after email confirmation", async () => {
    const email = `signin-${crypto.randomUUID()}@example.com`;
    const env = await server.getWorker().getEnv();
    await signUpAndConfirm(env.DB, server.fetch.bind(server), email);

    const response = await signIn(email);

    expect(response.status).toBe(200);
    const body = (await response.json()) as {
      access_token: string;
      user: { email: string };
    };
    expect(body.access_token).toBeTruthy();
    expect(body.user.email).toBe(email);
  });

  it("rejects invalid otp codes", async () => {
    const email = `bad-otp-${crypto.randomUUID()}@example.com`;
    await signUpUser(server.fetch.bind(server), email);

    const response = await server.fetch("http://example.com/auth/v1/verify", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        apikey,
      },
      body: JSON.stringify({ email, token: "000000", type: "signup" }),
    });

    expect(response.status).not.toBe(200);
  });

  it("rejects invalid credentials", async () => {
    const response = await signIn("missing-user@example.com", "wrong-password");

    expect(response.status).toBe(400);
    const body = (await response.json()) as { error_code: string };
    expect(body.error_code).toBe("invalid_credentials");
  });

  it("rejects getUser when the auth user row was deleted", async () => {
    const email = `deleted-${crypto.randomUUID()}@example.com`;
    const env = await server.getWorker().getEnv();
    const { confirm } = await signUpAndConfirm(env.DB, server.fetch.bind(server), email);

    await env.DB.prepare('DELETE FROM "auth.users" WHERE id = ?').bind(confirm.body.user.id).run();

    const response = await server.fetch("http://example.com/auth/v1/user", {
      headers: {
        apikey,
        authorization: `Bearer ${confirm.body.access_token}`,
      },
    });

    expect(response.status).not.toBe(200);
  });
});

describe("auth email integration", () => {
  const server = createTestHarness({
    workers: [testWorker],
  });

  beforeAll(async () => {
    await server.listen();
    await server.getWorker().applyD1Migrations("DB");
  });

  afterAll(async () => {
    await server.close();
  });

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

  it("rejects sign in until the email is confirmed", async () => {
    const email = `unconfirmed-${crypto.randomUUID()}@example.com`;
    const { response: signUpResponse } = await signUpUser(server.fetch.bind(server), email);
    expect(signUpResponse.status).toBe(200);

    const response = await signIn(email);

    expect(response.status).toBe(400);
    const body = (await response.json()) as { error_code: string };
    expect(body.error_code).toBe("email_not_confirmed");
  });

  it("accepts password recovery requests for existing users", async () => {
    const email = `recover-${crypto.randomUUID()}@example.com`;
    const env = await server.getWorker().getEnv();
    await signUpAndConfirm(env.DB, server.fetch.bind(server), email);

    const response = await server.fetch("http://example.com/auth/v1/recover", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        apikey,
      },
      body: JSON.stringify({ email }),
    });

    expect(response.status).toBe(200);

    const recovery = await confirmUserEmail(env.DB, server.fetch.bind(server), email, "recovery");
    expect(recovery.response.status).toBe(200);
    expect(recovery.body.access_token).toBeTruthy();
  });
});
