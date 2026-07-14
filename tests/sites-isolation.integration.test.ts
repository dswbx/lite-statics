import { createTestHarness } from "wrangler";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { signUpAndConfirm } from "./helpers/auth";

const apikey = "local-dev-key";
const testWorker = {
  configPath: "./wrangler.jsonc",
  vars: { EMAIL_FROM_ADDRESS: "" },
};

describe("sites isolation integration", () => {
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
    const email = `isolation-${crypto.randomUUID()}@example.com`;
    const env = await server.getWorker().getEnv();
    const { confirm } = await signUpAndConfirm(
      env.DB,
      server.fetch.bind(server),
      email,
      "password12345",
    );
    return confirm.body;
  }

  async function createSite(session: { access_token: string; user: { id: string } }, name: string) {
    const slug = `${name}-${crypto.randomUUID().slice(0, 8)}`;
    const response = await server.fetch("http://example.com/rest/v1/sites", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        apikey,
        authorization: `Bearer ${session.access_token}`,
        prefer: "return=representation",
      },
      body: JSON.stringify({
        owner_id: session.user.id,
        name,
        slug,
        access_mode: "public",
      }),
    });
    expect(response.status).toBe(201);
    return (await response.json()) as Array<{ id: string; owner_id: string }>;
  }

  async function listSites(session: { access_token: string }) {
    const response = await server.fetch("http://example.com/rest/v1/sites?select=*", {
      headers: {
        apikey,
        authorization: `Bearer ${session.access_token}`,
      },
    });
    expect(response.status).toBe(200);
    return (await response.json()) as Array<{ id: string; owner_id: string }>;
  }

  it("only returns sites owned by the requesting user", async () => {
    const alice = await signUp();
    const bob = await signUp();

    await createSite(alice, "alice-site");
    await createSite(bob, "bob-site");

    const aliceSites = await listSites(alice);
    const bobSites = await listSites(bob);

    // Each user sees exactly their own site, and never the other's.
    expect(aliceSites.map((s) => s.owner_id)).toEqual([alice.user.id]);
    expect(bobSites.map((s) => s.owner_id)).toEqual([bob.user.id]);
  });
});
