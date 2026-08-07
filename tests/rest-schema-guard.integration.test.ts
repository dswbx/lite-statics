import { createTestHarness } from "wrangler";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

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

  it("blocks anonymous access to internal storage.* tables", async () => {
    for (const table of ["storage.objects", "storage.buckets"]) {
      const response = await server.fetch(`http://example.com/rest/v1/${table}?select=*`, {
        headers: { apikey },
      });
      expect(response.status, `${table} should be blocked`).toBe(404);
    }
  });

  it("blocks selecting the storage schema via a profile header", async () => {
    const response = await server.fetch("http://example.com/rest/v1/objects?select=*", {
      headers: { apikey, "Accept-Profile": "storage" },
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
