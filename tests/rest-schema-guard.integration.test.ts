import { createTestHarness } from "wrangler";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { signUpAndConfirm } from "./helpers/auth";

const apikey = "local-dev-key";
const testWorker = {
  configPath: "./wrangler.jsonc",
  vars: { EMAIL_FROM_ADDRESS: "" },
};

describe("rest schema guard integration", () => {
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
    const email = `guard-${crypto.randomUUID()}@example.com`;
    const env = await server.getWorker().getEnv();
    const { confirm } = await signUpAndConfirm(
      env.DB,
      server.fetch.bind(server),
      email,
      "password12345",
    );
    return confirm.body;
  }

  it("blocks anonymous access to internal auth.* tables", async () => {
    // Create a user so auth.users actually has a row that would otherwise leak.
    await signUp();

    for (const table of [
      "auth.users",
      "auth.sessions",
      "auth.refresh_tokens",
      "auth.identities",
    ]) {
      const response = await server.fetch(`http://example.com/rest/v1/${table}?select=*`, {
        headers: { apikey },
      });
      expect(response.status, `${table} should be blocked`).toBe(404);
    }
  });

  it("blocks selecting the auth schema via a profile header", async () => {
    const response = await server.fetch("http://example.com/rest/v1/users?select=*", {
      headers: { apikey, "Accept-Profile": "auth" },
    });
    expect(response.status).toBe(404);
  });

  it("still serves public tables", async () => {
    const response = await server.fetch("http://example.com/rest/v1/sites?select=*", {
      headers: { apikey },
    });
    expect(response.status).toBe(200);
  });
});
