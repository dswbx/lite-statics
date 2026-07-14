import { createTestHarness } from "wrangler";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { signUpAndConfirm } from "./helpers/auth";

const apikey = "local-dev-key";
const testWorker = {
  configPath: "./wrangler.jsonc",
  vars: { EMAIL_FROM_ADDRESS: "" },
};

describe("profiles integration", () => {
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
    const email = `profile-${crypto.randomUUID()}@example.com`;
    const env = await server.getWorker().getEnv();
    const { confirm } = await signUpAndConfirm(
      env.DB,
      server.fetch.bind(server),
      email,
      "password12345",
    );
    return confirm.body;
  }

  it("creates a site when the profile row is missing but the auth user exists", async () => {
    const session = await signUp();
    const slug = `missing-profile-${crypto.randomUUID().slice(0, 8)}`;

    // Simulate a missing profile row directly in the DB. RLS has no user-facing
    // delete policy on profiles (by design), so this cannot go through REST.
    const env = await server.getWorker().getEnv();
    await env.DB.prepare("DELETE FROM profiles WHERE id = ?").bind(session.user.id).run();

    const recreateProfileResponse = await server.fetch("http://example.com/rest/v1/profiles", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        apikey,
        authorization: `Bearer ${session.access_token}`,
        prefer: "return=minimal",
      },
      body: JSON.stringify({ id: session.user.id, email: session.user.email }),
    });
    expect(recreateProfileResponse.status).toBe(201);

    const createSiteResponse = await server.fetch("http://example.com/rest/v1/sites", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        apikey,
        authorization: `Bearer ${session.access_token}`,
        prefer: "return=representation",
      },
      body: JSON.stringify({
        owner_id: session.user.id,
        name: "Recovered Profile Site",
        slug,
        access_mode: "public",
      }),
    });
    expect(createSiteResponse.status).toBe(201);
  });
});
