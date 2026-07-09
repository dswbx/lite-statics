import { createTestHarness } from "wrangler";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const apikey = "local-dev-key";

describe("profiles integration", () => {
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

  async function signUp() {
    const email = `profile-${crypto.randomUUID()}@example.com`;
    const response = await server.fetch("http://example.com/auth/v1/signup", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        apikey,
      },
      body: JSON.stringify({ email, password: "password12345" }),
    });
    expect(response.status).toBe(200);
    return (await response.json()) as { access_token: string; user: { id: string; email: string } };
  }

  it("creates a site when the profile row is missing but the auth user exists", async () => {
    const session = await signUp();
    const slug = `missing-profile-${crypto.randomUUID().slice(0, 8)}`;

    const deleteProfileResponse = await server.fetch("http://example.com/rest/v1/profiles", {
      method: "DELETE",
      headers: {
        apikey,
        authorization: `Bearer ${session.access_token}`,
        prefer: "return=minimal",
      },
    });
    expect(deleteProfileResponse.status).toBe(204);

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
