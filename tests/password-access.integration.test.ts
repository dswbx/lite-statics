import { createTestHarness } from "wrangler";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { hashPassword } from "../src/lib/password";
import { signUpAndConfirm } from "./helpers/auth";

const apikey = "local-dev-key";
const testWorker = {
  configPath: "./wrangler.jsonc",
  vars: { EMAIL_FROM_ADDRESS: "" },
};

describe("password-protected site access", () => {
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

  async function signUp() {
    const email = `password-site-${crypto.randomUUID()}@example.com`;
    const env = await server.getWorker().getEnv();
    const { confirm } = await signUpAndConfirm(
      env.DB,
      server.fetch.bind(server),
      email,
      "password12345",
    );
    return confirm.body;
  }

  it("accepts the dashboard password hash and sets a non-secure cookie over http", async () => {
    const session = await signUp();
    const slug = `private-${crypto.randomUUID().slice(0, 8)}`;
    const sitePassword = "harbor-secret";
    const hashed = await hashPassword(sitePassword);

    const createResponse = await server.fetch("http://example.com/rest/v1/sites", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        apikey,
        authorization: `Bearer ${session.access_token}`,
        prefer: "return=representation",
      },
      body: JSON.stringify({
        owner_id: session.user.id,
        name: "Private Harbor",
        slug,
        access_mode: "password",
        password_hash: hashed.hash,
        password_salt: hashed.salt,
      }),
    });
    expect(createResponse.status).toBe(201);

    const passwordBody = new URLSearchParams({ password: sitePassword });
    const unlockResponse = await server.fetch(`http://example.com/api/sites/${slug}/password`, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: passwordBody.toString(),
      redirect: "manual",
    });
    expect(unlockResponse.status).toBe(303);
    expect(unlockResponse.headers.get("location")).toBe(`/s/${slug}/`);
    const setCookie = unlockResponse.headers.get("set-cookie") ?? "";
    expect(setCookie).toContain("static_host_access=");
    expect(setCookie.toLowerCase()).not.toContain("secure");

    const wrongPasswordBody = new URLSearchParams({ password: "wrong-password" });
    const rejectedResponse = await server.fetch(`http://example.com/api/sites/${slug}/password`, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: wrongPasswordBody.toString(),
    });
    expect(rejectedResponse.status).toBe(401);
    await expect(rejectedResponse.text()).resolves.toContain("Password did not match.");
  });
});
